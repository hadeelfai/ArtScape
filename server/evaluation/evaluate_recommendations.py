"""
Recommendation System Evaluation Metrics for ArtScape
Comprehensive evaluation framework for CLIP-based artwork recommendations
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pymongo import MongoClient
import requests
import json
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Tuple, Any
from collections import defaultdict
import time
import os
from dotenv import load_dotenv
from bson import ObjectId
import matplotlib.patches as mpatches

# Set matplotlib style for better visuals
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

# Disable font warnings for cleaner output
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="matplotlib")

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class RecommendationEvaluator:
    """
    Comprehensive evaluation system for ArtScape recommendation engine
    """
    
    def __init__(self, mongodb_uri: str = None, 
                 db_name: str = None,
                 recommendation_service_url: str = None):
        """
        Initialize evaluator with database connections
        
        Args:
            mongodb_uri: MongoDB connection string (from env if None)
            db_name: Database name (from env if None)
            recommendation_service_url: URL of recommendation service (from env if None)
        """
        self.mongodb_uri = mongodb_uri or os.getenv('MONGO_URL') or os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
        
        # Extract database name from connection string or use default
        # Handle MongoDB Atlas URIs with query parameters
        if '/' in self.mongodb_uri.split('://')[-1]:
            # Split on '?' to remove query parameters first
            uri_without_params = self.mongodb_uri.split('?')[0]
            potential_db = db_name or uri_without_params.split('/')[-1] or os.getenv('DB_NAME', 'test')
        else:
            potential_db = db_name or os.getenv('DB_NAME', 'test')
        
        # For ArtScape, default to 'test' database as that's where data is
        # Handle cases where parsed db name contains query params
        if '?' in potential_db:
            potential_db = potential_db.split('?')[0]
        
        self.db_name = potential_db if potential_db not in ['admin', 'config', 'local', ''] else 'test'
        self.rec_service_url = recommendation_service_url or os.getenv('RECOMMENDATION_SERVICE_URL', 'http://localhost:5001')
        self.client = None
        self.db = None
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def connect_database(self):
        """Establish MongoDB connection"""
        try:
            self.client = MongoClient(self.mongodb_uri)
            self.db = self.client[self.db_name]
            self.logger.info(f"Connected to MongoDB: {self.db_name}")
        except Exception as e:
            self.logger.error(f"Database connection failed: {e}")
            raise
    
    def get_recommendation_service_health(self) -> Dict:
        """Check if recommendation service is healthy"""
        try:
            response = requests.get(f"{self.rec_service_url}/health", timeout=5)
            return response.json() if response.status_code == 200 else {"status": "unhealthy"}
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return {"status": "unreachable"}
    
    def calculate_cosine_similarity_metrics(self, sample_size: int = 1000) -> Dict:
        """
        Analyze cosine similarity distribution across recommendations
        
        Args:
            sample_size: Number of artwork pairs to sample
            
        Returns:
            Dictionary with similarity statistics
        """
        self.logger.info("Calculating cosine similarity metrics...")
        
        # Get artworks with embeddings - manual approach for Atlas compatibility
        all_artworks = list(self.db.artworks.find({}))
        artworks_with_embeddings = [art for art in all_artworks if 'clip_embedding' in art and art['clip_embedding']]
        
        if len(artworks_with_embeddings) < 2:
            return {"error": "Insufficient artworks with embeddings"}
        
        # Limit sample size if needed
        if len(artworks_with_embeddings) > sample_size:
            artworks_with_embeddings = artworks_with_embeddings[:sample_size]
        
        similarities = []
        
        # Sample pairs for similarity calculation
        for i in range(min(100, len(artworks_with_embeddings))):
            for j in range(i + 1, min(i + 10, len(artworks_with_embeddings))):
                emb1 = artworks_with_embeddings[i]["clip_embedding"]
                emb2 = artworks_with_embeddings[j]["clip_embedding"]
                
                # Calculate cosine similarity
                similarity = np.dot(emb1, emb2)
                similarities.append(similarity)
        
        return {
            "mean_similarity": np.mean(similarities),
            "std_similarity": np.std(similarities),
            "min_similarity": np.min(similarities),
            "max_similarity": np.max(similarities),
            "median_similarity": np.median(similarities),
            "sample_size": len(similarities)
        }
    
    def evaluate_recommendation_quality(self, test_artworks: List[str], top_k: int = 20) -> Dict:
        """
        Evaluate recommendation quality for test artworks
        
        Args:
            test_artworks: List of artwork IDs to test
            top_k: Number of recommendations to generate
            
        Returns:
            Dictionary with quality metrics
        """
        self.logger.info(f"Evaluating recommendation quality for {len(test_artworks)} artworks...")
        
        quality_metrics = {
            "total_evaluated": 0,
            "successful_recommendations": 0,
            "avg_response_time": 0,
            "similarity_scores": [],
            "artist_diversity_scores": [],
            "tag_overlap_scores": []
        }
        
        response_times = []
        
        for artwork_id in test_artworks:
            try:
                start_time = time.time()
                
                # Get recommendations
                response = requests.post(
                    f"{self.rec_service_url}/recommend/similar",
                    json={"artwork_id": artwork_id, "top_k": top_k},
                    timeout=10
                )
                
                response_time = time.time() - start_time
                response_times.append(response_time)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        quality_metrics["successful_recommendations"] += 1
                        
                        # Analyze recommendations
                        recommendations = data.get("recommendations", [])
                        
                        # Similarity scores
                        similarities = [r["similarity"] for r in recommendations]
                        quality_metrics["similarity_scores"].extend(similarities)
                        
                        # Artist diversity
                        artists = [r["artist_id"] for r in recommendations]
                        unique_artists = len(set(artists))
                        artist_diversity = unique_artists / len(artists) if artists else 0
                        quality_metrics["artist_diversity_scores"].append(artist_diversity)
                        
                        # Tag overlap (if available)
                        source_artwork = self.db.artworks.find_one({"_id": artwork_id})
                        if source_artwork and source_artwork.get("tags"):
                            source_tags = set(source_artwork["tags"])
                            tag_overlaps = []
                            
                            for rec in recommendations[:5]:  # Check top 5
                                rec_artwork = self.db.artworks.find_one({"_id": rec["artwork_id"]})
                                if rec_artwork and rec_artwork.get("tags"):
                                    rec_tags = set(rec_artwork["tags"])
                                    overlap = len(source_tags & rec_tags) / len(source_tags | rec_tags) if source_tags | rec_tags else 0
                                    tag_overlaps.append(overlap)
                            
                            if tag_overlaps:
                                quality_metrics["tag_overlap_scores"].extend(tag_overlaps)
                
                quality_metrics["total_evaluated"] += 1
                
            except Exception as e:
                self.logger.error(f"Error evaluating artwork {artwork_id}: {e}")
                continue
        
        # Calculate averages
        if response_times:
            quality_metrics["avg_response_time"] = np.mean(response_times)
        
        if quality_metrics["similarity_scores"]:
            quality_metrics["avg_similarity"] = np.mean(quality_metrics["similarity_scores"])
            quality_metrics["similarity_std"] = np.std(quality_metrics["similarity_scores"])
        
        if quality_metrics["artist_diversity_scores"]:
            quality_metrics["avg_artist_diversity"] = np.mean(quality_metrics["artist_diversity_scores"])
        
        if quality_metrics["tag_overlap_scores"]:
            quality_metrics["avg_tag_overlap"] = np.mean(quality_metrics["tag_overlap_scores"])
        
        return quality_metrics
    
    def evaluate_personalized_recommendations(self, test_users: List[str], top_k: int = 20) -> Dict:
        """
        Evaluate personalized recommendation quality
        
        Args:
            test_users: List of user IDs to test
            top_k: Number of recommendations to generate
            
        Returns:
            Dictionary with personalization metrics
        """
        self.logger.info(f"Evaluating personalized recommendations for {len(test_users)} users...")
        
        personalization_metrics = {
            "total_evaluated": 0,
            "successful_recommendations": 0,
            "users_with_history": 0,
            "avg_items_in_profile": 0,
            "recommendation_coverage": [],
            "profile_similarity_scores": []
        }
        
        for user_id in test_users:
            try:
                # Get user data - convert string ID to ObjectId for proper querying
                obj_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = self.db.users.find_one({"_id": obj_id})
                if not user:
                    continue
                
                # Check user interaction history
                liked = len(user.get("likedArtworks", []))
                saved = len(user.get("savedArtworks", []))
                purchased = len(user.get("purchasedArtworks", []))
                viewed = len(user.get("viewedArtworks", []))
                
                total_interactions = liked + saved + purchased + viewed
                personalization_metrics["avg_items_in_profile"] += total_interactions
                
                if total_interactions > 0:
                    personalization_metrics["users_with_history"] += 1
                
                # Get personalized recommendations
                response = requests.post(
                    f"{self.rec_service_url}/recommend/personalized",
                    json={"user_id": user_id, "top_k": top_k},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        personalization_metrics["successful_recommendations"] += 1
                        
                        # Check if recommendations are based on user history
                        based_on_items = data.get("based_on_items", 0)
                        if based_on_items > 0:
                            personalization_metrics["profile_similarity_scores"].append(based_on_items / total_interactions)
                        
                        recommendations = data.get("recommendations", [])
                        personalization_metrics["recommendation_coverage"].append(len(recommendations))
                
                personalization_metrics["total_evaluated"] += 1
                
            except Exception as e:
                self.logger.error(f"Error evaluating user {user_id}: {e}")
                continue
        
        # Calculate averages
        if personalization_metrics["total_evaluated"] > 0:
            personalization_metrics["avg_items_in_profile"] /= personalization_metrics["total_evaluated"]
        
        if personalization_metrics["profile_similarity_scores"]:
            personalization_metrics["avg_profile_utilization"] = np.mean(personalization_metrics["profile_similarity_scores"])
        
        if personalization_metrics["recommendation_coverage"]:
            personalization_metrics["avg_recommendation_count"] = np.mean(personalization_metrics["recommendation_coverage"])
        
        return personalization_metrics
    
    def evaluate_text_search_quality(self, test_queries: List[str], top_k: int = 20) -> Dict:
        """
        Evaluate text-based search quality
        
        Args:
            test_queries: List of test queries
            top_k: Number of results to retrieve
            
        Returns:
            Dictionary with search quality metrics
        """
        self.logger.info(f"Evaluating text search for {len(test_queries)} queries...")
        
        search_metrics = {
            "total_queries": 0,
            "successful_searches": 0,
            "avg_response_time": 0,
            "result_counts": [],
            "similarity_scores": []
        }
        
        response_times = []
        
        for query in test_queries:
            try:
                start_time = time.time()
                
                response = requests.post(
                    f"{self.rec_service_url}/recommend/text",
                    json={"query": query, "top_k": top_k},
                    timeout=10
                )
                
                response_time = time.time() - start_time
                response_times.append(response_time)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        search_metrics["successful_searches"] += 1
                        
                        recommendations = data.get("recommendations", [])
                        search_metrics["result_counts"].append(len(recommendations))
                        
                        # Similarity scores
                        similarities = [r["similarity"] for r in recommendations]
                        search_metrics["similarity_scores"].extend(similarities)
                
                search_metrics["total_queries"] += 1
                
            except Exception as e:
                self.logger.error(f"Error searching for query '{query}': {e}")
                continue
        
        # Calculate averages
        if response_times:
            search_metrics["avg_response_time"] = np.mean(response_times)
        
        if search_metrics["result_counts"]:
            search_metrics["avg_result_count"] = np.mean(search_metrics["result_counts"])
        
        if search_metrics["similarity_scores"]:
            search_metrics["avg_search_similarity"] = np.mean(search_metrics["similarity_scores"])
            search_metrics["search_similarity_std"] = np.std(search_metrics["similarity_scores"])
        
        return search_metrics
    
    def calculate_system_performance_metrics(self) -> Dict:
        """
        Calculate overall system performance metrics
        
        Returns:
            Dictionary with performance metrics
        """
        self.logger.info("Calculating system performance metrics...")
        
        # Database metrics - use manual counting for Atlas compatibility
        total_artworks = self.db.artworks.count_documents({})
        
        # Manual check for embeddings due to Atlas query limitations
        all_artworks = list(self.db.artworks.find({}))
        artworks_with_embeddings = len([art for art in all_artworks if 'clip_embedding' in art and art['clip_embedding']])
        embedding_coverage = artworks_with_embeddings / total_artworks if total_artworks > 0 else 0
        
        # User metrics
        total_users = self.db.users.count_documents({})
        users_with_interactions = len([
            user for user in self.db.users.find({})
            if (user.get('likedArtworks') or user.get('savedArtworks') or 
                user.get('purchasedArtworks') or user.get('viewedArtworks'))
        ])
        
        # Service health
        health = self.get_recommendation_service_health()
        
        return {
            "total_artworks": total_artworks,
            "artworks_with_embeddings": artworks_with_embeddings,
            "embedding_coverage": embedding_coverage,
            "total_users": total_users,
            "users_with_interactions": users_with_interactions,
            "user_engagement_rate": users_with_interactions / total_users if total_users > 0 else 0,
            "service_health": health.get("status", "unknown"),
            "model_loaded": health.get("model_loaded", False),
            "device": health.get("device", "unknown")
        }
    
    def generate_evaluation_report(self, output_file: str = "recommendation_evaluation_report.json") -> Dict:
        """
        Generate comprehensive evaluation report
        
        Args:
            output_file: File to save the report
            
        Returns:
            Complete evaluation report
        """
        self.logger.info("Generating comprehensive evaluation report...")
        
        # Connect to database
        self.connect_database()
        
        # Get sample data for evaluation
        sample_artworks = list(self.db.artworks.find({}, {"_id": 1}).limit(50))
        artwork_ids = [str(art["_id"]) for art in sample_artworks]
        
        sample_users = list(self.db.users.find({}, {"_id": 1}).limit(20))
        user_ids = [str(user["_id"]) for user in sample_users]
        
        test_queries = [
            "abstract painting",
            "landscape photography",
            "portrait art",
            "modern sculpture",
            "digital art",
            "watercolor painting",
            "oil painting",
            "minimalist art",
            "colorful artwork",
            "black and white photography"
        ]
        
        # Run all evaluations
        report = {
            "evaluation_timestamp": datetime.utcnow().isoformat(),
            "system_performance": self.calculate_system_performance_metrics(),
            "similarity_metrics": self.calculate_cosine_similarity_metrics(),
            "recommendation_quality": self.evaluate_recommendation_quality(artwork_ids),
            "personalized_recommendations": self.evaluate_personalized_recommendations(user_ids),
            "text_search_quality": self.evaluate_text_search_quality(test_queries),
            "test_parameters": {
                "sample_artworks": len(artwork_ids),
                "sample_users": len(user_ids),
                "test_queries": len(test_queries)
            }
        }
        
        # Save report
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        self.logger.info(f"Evaluation report saved to {output_file}")
        
        # Close database connection
        self.client.close()
        
        return report
    
    def generate_visualizations(self, report: Dict, output_dir: str = "evaluation_plots") -> str:
        """
        Generate visualizations for evaluation metrics
        
        Args:
            report: Evaluation report dictionary
            output_dir: Directory to save plots
            
        Returns:
            Path to generated plots directory
        """
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        # 1. System Performance Overview
        self._create_system_performance_plot(report, output_dir)
        
        # 2. Recommendation Quality Metrics
        self._create_quality_metrics_plot(report, output_dir)
        
        # 3. Personalization Analysis
        self._create_personalization_plot(report, output_dir)
        
        # 4. Threshold Compliance
        self._create_threshold_compliance_plot(report, output_dir)
        
        # 5. Similarity Distribution
        self._create_similarity_distribution_plot(report, output_dir)
        
        return output_dir
    
    def _create_system_performance_plot(self, report: Dict, output_dir: str):
        """Create system performance overview plot"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle('ArtScape Recommendation System Performance', fontsize=16, fontweight='bold')
        
        # System Performance
        perf = report['system_performance']
        
        # Artworks and Embeddings
        ax1.bar(['Total Artworks', 'With Embeddings'], 
                [perf['total_artworks'], perf['artworks_with_embeddings']],
                color=['#3498db', '#2ecc71'])
        ax1.set_title('Artwork Coverage')
        ax1.set_ylabel('Count')
        for i, v in enumerate([perf['total_artworks'], perf['artworks_with_embeddings']]):
            ax1.text(i, v + 1, str(v), ha='center', va='bottom')
        
        # User Engagement
        engagement_rate = perf['user_engagement_rate']
        ax2.pie([engagement_rate, 1-engagement_rate], 
                labels=['Engaged Users', 'Non-Engaged Users'],
                colors=['#2ecc71', '#e74c3c'],
                autopct='%1.1f%%',
                startangle=90)
        ax2.set_title(f'User Engagement ({engagement_rate:.1%})')
        
        # Service Health
        health_colors = {'healthy': '#2ecc71', 'unhealthy': '#e74c3c', 'unknown': '#f39c12'}
        health_color = health_colors.get(perf['service_health'], '#f39c12')
        ax3.bar(['Service Health'], [1], color=health_color)
        ax3.set_title(f'Service Status: {perf["service_health"].upper()}')
        ax3.set_ylim(0, 1.2)
        ax3.text(0, 0.5, perf['service_health'].upper(), 
                ha='center', va='center', fontweight='bold', color='white')
        
        # Device Info
        device_text = f"Device: {perf.get('device', 'Unknown')}\nModel: {perf.get('model_loaded', False)}"
        ax4.text(0.5, 0.5, device_text, ha='center', va='center', 
                fontsize=12, bbox=dict(boxstyle="round,pad=0.3", facecolor='lightblue'))
        ax4.set_title('System Info')
        ax4.axis('off')
        
        plt.tight_layout()
        plt.savefig(f'{output_dir}/system_performance.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def _create_quality_metrics_plot(self, report: Dict, output_dir: str):
        """Create recommendation quality metrics plot"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle('Recommendation Quality Metrics', fontsize=16, fontweight='bold')
        
        if 'recommendation_quality' in report:
            rq = report['recommendation_quality']
            
            # Success Rate
            success_rate = rq['successful_recommendations'] / rq['total_evaluated'] if rq['total_evaluated'] > 0 else 0
            ax1.bar(['Success Rate'], [success_rate], color='#2ecc71' if success_rate > 0.95 else '#e74c3c')
            ax1.set_title(f'Success Rate: {success_rate:.1%}')
            ax1.set_ylim(0, 1.1)
            ax1.text(0, success_rate + 0.02, f'{success_rate:.1%}', ha='center', fontweight='bold')
            
            # Response Time
            if rq.get('avg_response_time'):
                ax2.bar(['Avg Response Time'], [rq['avg_response_time']], 
                       color='#2ecc71' if rq['avg_response_time'] < 0.5 else '#f39c12')
                ax2.set_title(f'Response Time: {rq["avg_response_time"]:.3f}s')
                ax2.set_ylabel('Seconds')
                ax2.axhline(y=0.5, color='red', linestyle='--', alpha=0.7, label='Target (0.5s)')
                ax2.legend()
            
            # Similarity Scores
            if rq.get('similarity_scores'):
                similarities = rq['similarity_scores'][:50]  # Show first 50
                ax3.hist(similarities, bins=15, color='#3498db', alpha=0.7, edgecolor='black')
                ax3.set_title('Similarity Score Distribution')
                ax3.set_xlabel('Cosine Similarity')
                ax3.set_ylabel('Frequency')
                ax3.axvline(x=np.mean(similarities), color='red', linestyle='--', 
                           label=f'Mean: {np.mean(similarities):.3f}')
                ax3.legend()
            
            # Artist Diversity
            if rq.get('avg_artist_diversity'):
                diversity = rq['avg_artist_diversity']
                ax4.bar(['Artist Diversity'], [diversity], 
                       color='#2ecc71' if diversity > 0.7 else '#f39c12')
                ax4.set_title(f'Artist Diversity: {diversity:.1%}')
                ax4.set_ylim(0, 1)
                ax4.axhline(y=0.7, color='red', linestyle='--', alpha=0.7, label='Target (70%)')
                ax4.legend()
        
        plt.tight_layout()
        plt.savefig(f'{output_dir}/quality_metrics.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def _create_personalization_plot(self, report: Dict, output_dir: str):
        """Create personalization analysis plot"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle('Personalization Analysis', fontsize=16, fontweight='bold')
        
        if 'personalized_recommendations' in report:
            pr = report['personalized_recommendations']
            
            # Users with History
            users_with_history = pr['users_with_history']
            total_users = pr['total_evaluated']
            history_rate = users_with_history / total_users if total_users > 0 else 0
            
            ax1.pie([history_rate, 1-history_rate], 
                    labels=['Users with History', 'Users without History'],
                    colors=['#2ecc71', '#e74c3c'],
                    autopct='%1.1f%%',
                    startangle=90)
            ax1.set_title(f'User History Coverage ({history_rate:.1%})')
            
            # Average Items in Profile
            if pr.get('avg_items_in_profile'):
                ax2.bar(['Avg Items/Profile'], [pr['avg_items_in_profile']], color='#3498db')
                ax2.set_title(f'Avg Profile Items: {pr["avg_items_in_profile"]:.1f}')
                ax2.set_ylabel('Count')
            
            # Profile Utilization
            if pr.get('avg_profile_utilization'):
                utilization = pr['avg_profile_utilization']
                ax3.bar(['Profile Utilization'], [utilization], 
                       color='#2ecc71' if utilization > 0.4 else '#f39c12')
                ax3.set_title(f'Profile Utilization: {utilization:.1%}')
                ax3.set_ylim(0, 1)
                ax3.axhline(y=0.4, color='red', linestyle='--', alpha=0.7, label='Target (40%)')
                ax3.legend()
            
            # Recommendation Coverage
            if pr.get('recommendation_coverage'):
                coverage = pr['recommendation_coverage']
                ax4.hist(coverage, bins=10, color='#9b59b6', alpha=0.7, edgecolor='black')
                ax4.set_title('Recommendations per User')
                ax4.set_xlabel('Number of Recommendations')
                ax4.set_ylabel('Frequency')
        
        plt.tight_layout()
        plt.savefig(f'{output_dir}/personalization.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def _create_threshold_compliance_plot(self, report: Dict, output_dir: str):
        """Create threshold compliance visualization"""
        fig, ax = plt.subplots(figsize=(12, 8))
        
        # Define thresholds
        thresholds = {
            'Embedding\nCoverage': {'current': report['system_performance']['embedding_coverage'], 'target': 0.8},
            'User\nEngagement': {'current': report['system_performance']['user_engagement_rate'], 'target': 0.3},
            'Success\nRate': {'current': report['recommendation_quality']['successful_recommendations'] / report['recommendation_quality']['total_evaluated'], 'target': 0.95},
            'Response\nTime': {'current': 1 - (report['recommendation_quality']['avg_response_time'] / 0.5), 'target': 0.0},  # Inverted for display
            'Similarity\nScore': {'current': report['recommendation_quality']['avg_similarity'], 'target': 0.3},
            'Artist\nDiversity': {'current': report['recommendation_quality']['avg_artist_diversity'], 'target': 0.7},
            'Profile\nUtilization': {'current': report['personalized_recommendations']['avg_profile_utilization'], 'target': 0.4}
        }
        
        metrics = list(thresholds.keys())
        current_values = [thresholds[m]['current'] for m in metrics]
        target_values = [thresholds[m]['target'] for m in metrics]
        
        # Create bars
        x = np.arange(len(metrics))
        width = 0.35
        
        bars1 = ax.bar(x - width/2, current_values, width, label='Current', color='#3498db')
        bars2 = ax.bar(x + width/2, target_values, width, label='Target', color='#e74c3c', alpha=0.7)
        
        # Add value labels on bars
        for bar in bars1:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                   f'{height:.1%}', ha='center', va='bottom', fontsize=10)
        
        ax.set_xlabel('Metrics')
        ax.set_ylabel('Performance')
        ax.set_title('Threshold Compliance Analysis', fontsize=16, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(metrics, rotation=45, ha='right')
        ax.legend()
        ax.set_ylim(0, 1.1)
        
        plt.tight_layout()
        plt.savefig(f'{output_dir}/threshold_compliance.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def _create_similarity_distribution_plot(self, report: Dict, output_dir: str):
        """Create similarity distribution analysis"""
        if 'similarity_metrics' not in report or 'error' in report['similarity_metrics']:
            return
            
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        fig.suptitle('Similarity Analysis', fontsize=16, fontweight='bold')
        
        sim_metrics = report['similarity_metrics']
        
        # Similarity statistics
        stats = ['Mean', 'Std', 'Min', 'Max', 'Median']
        values = [sim_metrics['mean_similarity'], sim_metrics['std_similarity'],
                 sim_metrics['min_similarity'], sim_metrics['max_similarity'], sim_metrics['median_similarity']]
        
        ax1.bar(stats, values, color=['#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#3498db'])
        ax1.set_title('Similarity Statistics')
        ax1.set_ylabel('Cosine Similarity')
        ax1.set_ylim(0, 1)
        
        # Add value labels
        for i, v in enumerate(values):
            ax1.text(i, v + 0.01, f'{v:.3f}', ha='center', va='bottom', fontweight='bold')
        
        # Distribution (if we have the raw data)
        if 'recommendation_quality' in report and 'similarity_scores' in report['recommendation_quality']:
            similarities = report['recommendation_quality']['similarity_scores'][:100]
            ax2.hist(similarities, bins=20, color='#3498db', alpha=0.7, edgecolor='black')
            ax2.set_title('Similarity Score Distribution')
            ax2.set_xlabel('Cosine Similarity')
            ax2.set_ylabel('Frequency')
            ax2.axvline(x=sim_metrics['mean_similarity'], color='red', linestyle='--', 
                       label=f'Mean: {sim_metrics["mean_similarity"]:.3f}')
            ax2.legend()
        
        plt.tight_layout()
        plt.savefig(f'{output_dir}/similarity_analysis.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def print_summary_report(self, report: Dict):
        print("\n" + "="*60)
        print("ARTSCAPE RECOMMENDATION SYSTEM EVALUATION REPORT")
        print("="*60)
        
        # System Performance
        perf = report["system_performance"]
        print(f"\n📊 SYSTEM PERFORMANCE:")
        print(f"   Total Artworks: {perf['total_artworks']}")
        print(f"   Embedding Coverage: {perf['embedding_coverage']:.2%}")
        print(f"   User Engagement Rate: {perf['user_engagement_rate']:.2%}")
        print(f"   Service Health: {perf['service_health']}")
        
        # Recommendation Quality
        if "recommendation_quality" in report:
            rq = report["recommendation_quality"]
            print(f"\n🎯 RECOMMENDATION QUALITY:")
            print(f"   Success Rate: {rq['successful_recommendations']}/{rq['total_evaluated']}")
            print(f"   Avg Response Time: {rq.get('avg_response_time', 0):.3f}s")
            if "avg_similarity" in rq:
                print(f"   Avg Similarity Score: {rq['avg_similarity']:.3f}")
            if "avg_artist_diversity" in rq:
                print(f"   Artist Diversity: {rq['avg_artist_diversity']:.2%}")
        
        # Personalized Recommendations
        if "personalized_recommendations" in report:
            pr = report["personalized_recommendations"]
            print(f"\n👤 PERSONALIZED RECOMMENDATIONS:")
            print(f"   Users with History: {pr['users_with_history']}/{pr['total_evaluated']}")
            print(f"   Avg Items in Profile: {pr['avg_items_in_profile']:.1f}")
            if "avg_profile_utilization" in pr:
                print(f"   Profile Utilization: {pr['avg_profile_utilization']:.2%}")
        
        # Text Search
        if "text_search_quality" in report:
            ts = report["text_search_quality"]
            print(f"\n🔍 TEXT SEARCH QUALITY:")
            print(f"   Success Rate: {ts['successful_searches']}/{ts['total_queries']}")
            print(f"   Avg Response Time: {ts.get('avg_response_time', 0):.3f}s")
            if "avg_search_similarity" in ts:
                print(f"   Avg Search Similarity: {ts['avg_search_similarity']:.3f}")
        
        print("\n" + "="*60)


def main():
    """Main function to run evaluation"""
    evaluator = RecommendationEvaluator()
    
    try:
        # Generate comprehensive report
        report = evaluator.generate_evaluation_report()
        
        # Print summary
        evaluator.print_summary_report(report)
        
        print(f"\n📄 Full report saved to: recommendation_evaluation_report.json")
        
    except Exception as e:
        print(f"❌ Evaluation failed: {e}")
        logging.error(f"Evaluation error: {e}")


if __name__ == "__main__":
    main()
