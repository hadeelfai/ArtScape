# Recommendation System Evaluation

This directory contains comprehensive evaluation tools for the ArtScape CLIP-based recommendation system with **automated visualizations**.

## Quick Start

```bash
# Install required dependencies
pip install -r requirements.txt

# Run comprehensive evaluation with visualizations
./quick_evaluation.sh

# Generate visualizations from existing report
python3 generate_visualizations.py

# Display charts interactively
python3 show_charts.py
```

## Generated Visualizations

The evaluation system automatically generates 5 comprehensive charts:

### 📊 1. System Performance Overview
- **Artwork Coverage**: Total artworks vs. those with embeddings
- **User Engagement**: Pie chart of engaged vs. non-engaged users  
- **Service Health**: System status indicator
- **System Info**: Device and model information

### 🎯 2. Recommendation Quality Metrics
- **Success Rate**: Request success percentage with target comparison
- **Response Time**: Average response time vs. 500ms target
- **Similarity Distribution**: Histogram of cosine similarity scores
- **Artist Diversity**: Diversity percentage vs. 70% target

### 👤 3. Personalization Analysis
- **User History Coverage**: Users with interaction history
- **Profile Items**: Average items per user profile
- **Profile Utilization**: How well user data is used (target: 40%)
- **Recommendation Coverage**: Distribution of recommendations per user

### 🎯 4. Threshold Compliance Analysis
- **Side-by-side comparison** of current vs. target values for all metrics
- **Visual indicators** for passing/failing thresholds
- **Percentage labels** for easy reading

### 🔍 5. Similarity Analysis
- **Statistics Bar Chart**: Mean, std, min, max, median similarities
- **Distribution Histogram**: Actual similarity score distribution

## Available Scripts

### `quick_evaluation.sh`
Automated evaluation with visualizations:
- Health checks (service + database)
- Comprehensive evaluation
- Automatic chart generation
- Threshold validation

### `generate_visualizations.py`
Generate charts from existing report:
```bash
python3 generate_visualizations.py [report_file]
```

### `show_charts.py`
Interactive chart display:
```bash
python3 show_charts.py
```

### `evaluate_recommendations.py`
Core evaluation engine with visualization methods:
- `generate_visualizations()` - Create all charts
- `_create_*_plot()` - Individual chart generators

## Understanding the Visualizations

### Color Coding
- 🟢 **Green**: Meeting or exceeding targets
- 🟡 **Yellow**: Needs attention but acceptable  
- 🔴 **Red**: Below target thresholds

### Key Metrics Visualized

**Performance Indicators:**
- **Embedding Coverage**: Should be > 80% (green bar)
- **Response Time**: Should be < 500ms (below red line)
- **Success Rate**: Should be > 95% (green bar)

**Quality Indicators:**
- **Similarity Scores**: Higher is better (0-1 scale)
- **Artist Diversity**: Should be > 70% (above red line)
- **Profile Utilization**: Should be > 40% (above red line)

## Custom Test Data

Create sample interaction data for testing:
```bash
cd ../scripts
node populate_interactions.js
```

## Continuous Monitoring

Set up automated evaluation with visualizations:
```bash
# Daily evaluation at 2 AM
0 2 * * * cd /path/to/ArtScape/server/evaluation && ./quick_evaluation.sh
```

## Troubleshooting

### Font Issues
If you see font warnings, they're cosmetic. Charts will still generate correctly.

### Missing Charts
```bash
# Regenerate visualizations
python3 generate_visualizations.py latest_evaluation_report.json
```

### Display Issues
```bash
# Check if plots exist
ls -la evaluation_plots/

# Display individual chart
python3 show_charts.py
```

## Integration with CI/CD

Add to your pipeline:
```yaml
- name: Evaluate Recommendations
  run: |
    cd server/evaluation
    ./quick_evaluation.sh
    python3 check_metrics.py --threshold=0.7
```

## File Structure

```
evaluation/
├── README.md                    # This documentation
├── evaluate_recommendations.py  # Core evaluation + visualization engine
├── check_metrics.py            # Threshold validation
├── quick_evaluation.sh         # Automated evaluation runner
├── generate_visualizations.py   # Standalone chart generator
├── show_charts.py             # Interactive chart viewer
├── requirements.txt            # Dependencies
├── latest_evaluation_report.json # Latest results
├── metrics_validation.json     # Threshold results
└── evaluation_plots/           # Generated charts
    ├── system_performance.png
    ├── quality_metrics.png
    ├── personalization.png
    ├── threshold_compliance.png
    └── similarity_analysis.png
