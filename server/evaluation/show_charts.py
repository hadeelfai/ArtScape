#!/usr/bin/env python3
"""
Display evaluation visualizations
Usage: python show_charts.py
"""

import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import os

def show_charts():
    plots_dir = 'evaluation_plots'
    
    if not os.path.exists(plots_dir):
        print(f"❌ Plots directory not found: {plots_dir}")
        print("Run evaluation first: ./quick_evaluation.sh")
        return
    
    charts = [
        ('system_performance.png', 'System Performance Overview'),
        ('quality_metrics.png', 'Recommendation Quality Metrics'),
        ('personalization.png', 'Personalization Analysis'),
        ('threshold_compliance.png', 'Threshold Compliance'),
        ('similarity_analysis.png', 'Similarity Analysis')
    ]
    
    for chart_file, title in charts:
        chart_path = os.path.join(plots_dir, chart_file)
        if os.path.exists(chart_path):
            print(f"📊 Displaying: {title}")
            
            # Load and display image
            img = mpimg.imread(chart_path)
            plt.figure(figsize=(12, 8))
            plt.imshow(img)
            plt.title(title, fontsize=16, fontweight='bold')
            plt.axis('off')
            plt.tight_layout()
            plt.show()
        else:
            print(f"⚠️ Chart not found: {chart_file}")

if __name__ == "__main__":
    show_charts()
