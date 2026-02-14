#!/usr/bin/env python3
"""
Generate visualizations from existing evaluation report
Usage: python generate_visualizations.py [report_file]
"""

import sys
import os
from evaluate_recommendations import RecommendationEvaluator

def main():
    # Get report file from command line or use default
    report_file = sys.argv[1] if len(sys.argv) > 1 else 'latest_evaluation_report.json'
    
    if not os.path.exists(report_file):
        print(f"❌ Report file not found: {report_file}")
        print("Usage: python generate_visualizations.py [report_file]")
        sys.exit(1)
    
    print(f"📊 Loading report from: {report_file}")
    
    # Load report
    import json
    with open(report_file, 'r') as f:
        report = json.load(f)
    
    # Generate visualizations
    evaluator = RecommendationEvaluator()
    plots_dir = evaluator.generate_visualizations(report, 'evaluation_plots')
    
    print(f"📈 Visualizations generated successfully!")
    print(f"📁 Saved to: {plots_dir}")
    print("")
    print("📊 Generated Charts:")
    print("   • system_performance.png - System overview")
    print("   • quality_metrics.png - Recommendation quality") 
    print("   • personalization.png - User personalization")
    print("   • threshold_compliance.png - Quality thresholds")
    print("   • similarity_analysis.png - Similarity distribution")

if __name__ == "__main__":
    main()
