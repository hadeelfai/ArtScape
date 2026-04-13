#!/bin/bash

# ArtScape Recommendation System Quick Evaluation
# Clean, optimized evaluation script

set -e

echo "🎨 ArtScape Recommendation System Evaluation"
echo "============================================"

# Check if recommendation service is running
echo "🔍 Checking recommendation service health..."
if curl -s http://localhost:7860/health > /dev/null; then
    echo "✅ Recommendation service is running"
else
    echo "❌ Recommendation service is not running on port 7860"
    echo "Please start the service first:"
    echo "cd server/recommendation-service && python recommendation_service.py"
    exit 1
fi

# Check MongoDB connection
echo "🔍 Checking MongoDB connection..."
if python3 -c "
import sys
import os
sys.path.append('.')
from dotenv import load_dotenv
import pymongo

load_dotenv('../.env')
mongodb_uri = os.getenv('MONGO_URL') or os.getenv('MONGODB_URI', 'mongodb://localhost:27017')

try:
    client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=2000)
    client.server_info()
    print('✅ MongoDB connection successful')
    client.close()
except Exception as e:
    print('❌ MongoDB connection failed:', e)
    exit(1)
"; then
    echo "✅ MongoDB is accessible"
else
    echo "❌ MongoDB is not running or not accessible"
    exit 1
fi

# Install packages if needed
echo "📦 Checking dependencies..."
pip3 install python-dotenv numpy pandas pymongo requests > /dev/null 2>&1

# Run comprehensive evaluation
echo ""
echo "🚀 Running Comprehensive Evaluation"
echo "=================================="
python3 -c "
import sys
sys.path.append('.')
from evaluate_recommendations import RecommendationEvaluator

evaluator = RecommendationEvaluator()
report = evaluator.generate_evaluation_report('latest_evaluation_report.json')

# Generate visualizations
print('📊 Generating visualizations...')
plots_dir = evaluator.generate_visualizations(report, 'evaluation_plots')
print(f'📈 Visualizations saved to: {plots_dir}')

# Print summary
evaluator.print_summary_report(report)
"

# Check metrics against thresholds
echo ""
echo "🎯 Validating Against Quality Thresholds"
echo "========================================"
python3 check_metrics.py latest_evaluation_report.json

echo ""
echo "🎉 Evaluation Complete!"
echo "======================"
echo "📄 Report saved to: latest_evaluation_report.json"
echo "📊 Validation saved to: metrics_validation.json"
echo "📈 Visualizations saved to: evaluation_plots/"
echo ""
echo "📊 Generated Charts:"
echo "   • system_performance.png - System overview"
echo "   • quality_metrics.png - Recommendation quality"
echo "   • personalization.png - User personalization"
echo "   • threshold_compliance.png - Quality thresholds"
echo "   • similarity_analysis.png - Similarity distribution"
