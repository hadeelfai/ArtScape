"""
Metrics Threshold Checker for ArtScape Recommendation System
Validates evaluation results against predefined quality thresholds
"""

import json
import argparse
import sys
from typing import Dict, List, Tuple

class MetricsChecker:
    """Validates recommendation system metrics against quality thresholds"""
    
    def __init__(self):
        # Define quality thresholds
        self.thresholds = {
            "embedding_coverage": {
                "minimum": 0.8,
                "target": 0.95,
                "description": "Percentage of artworks with CLIP embeddings"
            },
            "user_engagement_rate": {
                "minimum": 0.3,
                "target": 0.6,
                "description": "Percentage of users with interaction history"
            },
            "avg_response_time": {
                "maximum": 0.5,
                "target": 0.2,
                "description": "Average recommendation response time in seconds"
            },
            "success_rate": {
                "minimum": 0.95,
                "target": 0.99,
                "description": "Percentage of successful recommendation requests"
            },
            "avg_similarity": {
                "minimum": 0.3,
                "target": 0.5,
                "description": "Average similarity score for recommendations"
            },
            "artist_diversity": {
                "minimum": 0.7,
                "target": 0.85,
                "description": "Diversity of artists in recommendations"
            },
            "profile_utilization": {
                "minimum": 0.4,
                "target": 0.7,
                "description": "How well user profiles are utilized for personalization"
            }
        }
    
    def load_report(self, report_file: str) -> Dict:
        """Load evaluation report from JSON file"""
        try:
            with open(report_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Report file not found: {report_file}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in report file: {e}")
            sys.exit(1)
    
    def extract_metrics(self, report: Dict) -> Dict:
        """Extract relevant metrics from evaluation report"""
        metrics = {}
        
        # System performance metrics
        if "system_performance" in report:
            perf = report["system_performance"]
            metrics["embedding_coverage"] = perf.get("embedding_coverage", 0)
            metrics["user_engagement_rate"] = perf.get("user_engagement_rate", 0)
        
        # Recommendation quality metrics
        if "recommendation_quality" in report:
            rq = report["recommendation_quality"]
            total = rq.get("total_evaluated", 1)
            successful = rq.get("successful_recommendations", 0)
            metrics["success_rate"] = successful / total if total > 0 else 0
            metrics["avg_response_time"] = rq.get("avg_response_time", float('inf'))
            metrics["avg_similarity"] = rq.get("avg_similarity", 0)
            metrics["artist_diversity"] = rq.get("avg_artist_diversity", 0)
        
        # Personalized recommendation metrics
        if "personalized_recommendations" in report:
            pr = report["personalized_recommendations"]
            metrics["profile_utilization"] = pr.get("avg_profile_utilization", 0)
        
        return metrics
    
    def check_thresholds(self, metrics: Dict, strict_mode: bool = False) -> Tuple[bool, List[Dict]]:
        """
        Check metrics against thresholds
        
        Args:
            metrics: Extracted metrics from evaluation
            strict_mode: If True, use target values instead of minimum
            
        Returns:
            Tuple of (overall_pass, list_of_issues)
        """
        issues = []
        overall_pass = True
        
        for metric_name, value in metrics.items():
            if metric_name not in self.thresholds:
                continue
            
            threshold = self.thresholds[metric_name]
            
            # Determine which threshold to use
            if strict_mode:
                if "target" in threshold:
                    required_value = threshold["target"]
                    comparison = "target"
                else:
                    required_value = threshold["minimum"]
                    comparison = "minimum"
            else:
                if "minimum" in threshold:
                    required_value = threshold["minimum"]
                    comparison = "minimum"
                else:
                    required_value = threshold["maximum"]
                    comparison = "maximum"
            
            # Check based on metric type
            passed = False
            if comparison in ["minimum", "target"]:
                passed = value >= required_value
            elif comparison == "maximum":
                passed = value <= required_value
            
            if not passed:
                overall_pass = False
                issues.append({
                    "metric": metric_name,
                    "description": threshold["description"],
                    "current_value": value,
                    "required_value": required_value,
                    "comparison": comparison,
                    "status": "FAILED"
                })
            else:
                issues.append({
                    "metric": metric_name,
                    "description": threshold["description"],
                    "current_value": value,
                    "required_value": required_value,
                    "comparison": comparison,
                    "status": "PASSED"
                })
        
        return overall_pass, issues
    
    def print_results(self, issues: List[Dict], overall_pass: bool):
        """Print formatted results"""
        print("\n" + "="*70)
        print("🎯 METRICS THRESHOLD VALIDATION RESULTS")
        print("="*70)
        
        # Group by status
        passed = [issue for issue in issues if issue["status"] == "PASSED"]
        failed = [issue for issue in issues if issue["status"] == "FAILED"]
        
        if passed:
            print(f"\n✅ PASSED METRICS ({len(passed)}):")
            print("-" * 40)
            for issue in passed:
                metric = issue["metric"]
                desc = issue["description"]
                current = issue["current_value"]
                required = issue["required_value"]
                
                if isinstance(current, float):
                    if metric in ["avg_response_time"]:
                        print(f"   {metric}: {current:.3f}s (required: ≤{required:.3f}s)")
                    else:
                        print(f"   {metric}: {current:.2%} (required: ≥{required:.2%})")
                else:
                    print(f"   {metric}: {current} (required: {required})")
                print(f"      → {desc}")
        
        if failed:
            print(f"\n❌ FAILED METRICS ({len(failed)}):")
            print("-" * 40)
            for issue in failed:
                metric = issue["metric"]
                desc = issue["description"]
                current = issue["current_value"]
                required = issue["required_value"]
                comparison = issue["comparison"]
                
                if isinstance(current, float):
                    if metric in ["avg_response_time"]:
                        print(f"   {metric}: {current:.3f}s (required: ≤{required:.3f}s)")
                    else:
                        print(f"   {metric}: {current:.2%} (required: ≥{required:.2%})")
                else:
                    print(f"   {metric}: {current} (required: {required})")
                print(f"      → {desc}")
        
        # Overall result
        print(f"\n🏁 OVERALL RESULT: {'✅ PASS' if overall_pass else '❌ FAIL'}")
        print("="*70)
        
        # Recommendations
        if failed:
            print(f"\n🔧 RECOMMENDATIONS:")
            for issue in failed:
                metric = issue["metric"]
                if metric == "embedding_coverage":
                    print("   • Run batch embedding generation for missing artworks")
                elif metric == "user_engagement_rate":
                    print("   • Improve user onboarding and engagement features")
                elif metric == "avg_response_time":
                    print("   • Optimize recommendation algorithm or add caching")
                elif metric == "success_rate":
                    print("   • Check recommendation service logs for errors")
                elif metric == "avg_similarity":
                    print("   • Review CLIP model configuration and image quality")
                elif metric == "artist_diversity":
                    print("   • Adjust recommendation algorithm to increase diversity")
                elif metric == "profile_utilization":
                    print("   • Improve user interaction tracking and profiling")
    
    def save_results(self, issues: List[Dict], overall_pass: bool, output_file: str):
        """Save results to JSON file"""
        results = {
            "validation_timestamp": json.dumps({"$date": {"$numberLong": str(int(__import__('time').time() * 1000))}}),
            "overall_pass": overall_pass,
            "total_metrics_checked": len(issues),
            "passed_metrics": len([i for i in issues if i["status"] == "PASSED"]),
            "failed_metrics": len([i for i in issues if i["status"] == "FAILED"]),
            "threshold_results": issues,
            "thresholds_used": self.thresholds
        }
        
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print(f"\n📄 Validation results saved to: {output_file}")


def main():
    parser = argparse.ArgumentParser(description="Validate recommendation system metrics against thresholds")
    parser.add_argument("report_file", help="Path to evaluation report JSON file")
    parser.add_argument("--strict", action="store_true", help="Use target values instead of minimum thresholds")
    parser.add_argument("--output", default="metrics_validation.json", help="Output file for validation results")
    parser.add_argument("--quiet", action="store_true", help="Only print final result")
    
    args = parser.parse_args()
    
    checker = MetricsChecker()
    
    # Load and extract metrics
    report = checker.load_report(args.report_file)
    metrics = checker.extract_metrics(report)
    
    # Check thresholds
    overall_pass, issues = checker.check_thresholds(metrics, args.strict)
    
    # Print results
    if not args.quiet:
        checker.print_results(issues, overall_pass)
    else:
        print("PASS" if overall_pass else "FAIL")
    
    # Save results
    checker.save_results(issues, overall_pass, args.output)
    
    # Exit with appropriate code
    sys.exit(0 if overall_pass else 1)


if __name__ == "__main__":
    main()
