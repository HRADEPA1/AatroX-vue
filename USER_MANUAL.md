# User Manual - Dashboard Management

## Overview

This application allows you to import and display Grafana dashboards with InfluxDB data sources. You can create dashboards in Grafana, export them as JSON, and import them into this system for visualization.

## Dashboard Creation in Grafana

### 1. Prepare Your InfluxDB Data Source

Before creating dashboards, ensure your InfluxDB is configured in Grafana:

1. Go to Grafana → Configuration → Data Sources
2. Add or configure InfluxDB data source
3. Set connection parameters:
   - URL: `http://localhost:8086`
   - Organization: Your InfluxDB organization
   - Token: Your InfluxDB access token
   - Default bucket: `machine_data`

### 2. Create Dashboard Panels

#### Supported Panel Types

The application supports the following Grafana panel types:

- **Time Series** - Line charts with time-based data
- **Bar Chart** - Vertical or horizontal bar charts
- **Gauge** - Circular gauge with thresholds
- **Stat** - Single value display
- **Status History** - Grid visualization for status over time

#### Time Series Configuration

1. Create a new panel
2. Select "Time series" visualization
3. Configure the query using Flux query language:
   ```flux
   from(bucket: "machine_data")
     |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
     |> filter(fn: (r) => r._measurement == "pegas_data")
     |> filter(fn: (r) => r.name == "Your_Field_Name")
     |> aggregateWindow(every: v.windowPeriod, fn: mean)
   ```

4. **Draw Style Options**:
   - `Line` - Continuous line chart (default)
   - `Bars` - Bar chart with time scale
   - `Points` - Scatter plot with points only

5. **Threshold Configuration**:
   - Go to Panel → Field → Thresholds
   - Add threshold steps with values and colors
   - Choose mode: Absolute or Percentage
   - Supported colors: green, yellow, red, orange, blue

6. **Fill Opacity**:
   - Set `Fill opacity` to 0 for no fill (clean lines)
   - Set to 10-80 for semi-transparent fill

#### Bar Chart Configuration

1. Select "Bar chart" or "Bar gauge" visualization
2. Configure orientation (horizontal/vertical)
3. Set stacking options:
   - `None` - Regular bars
   - `Normal` - Stacked values
   - `Percent` - Stacked as percentage (0-100%)

#### Gauge Configuration

1. Select "Gauge" visualization
2. Set min/max values
3. Configure thresholds with colors
4. The gauge displays as a full 360° circle

#### Wide Format Queries (Multiple Columns)

For charts with multiple series (e.g., ProductionTime, DownTime, OffTime):

```flux
// Example: Daily time analysis
powerOnDaily = from(bucket: "machine_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement == "pegas_data")
  |> aggregateWindow(every: 1d, fn: count)
  |> rename(columns: {_value: "powerOnMin"})

prodDaily = from(bucket: "machine_data")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement == "pegas_data")
  |> aggregateWindow(every: 1d, fn: sum)
  |> rename(columns: {_value: "prodMin"})

join(tables: {p: powerOnDaily, pr: prodDaily}, on: ["_time", "topic"])
  |> map(fn: (r) => ({
      _time: r._time,
      ProductionTime: r.powerOnMin / 60.0,
      DownTime: r.downMin / 60.0,
      OffTime: r.offMin / 60.0
    }))
```

**Important**: When using custom column names like `date` instead of `_time`, ensure the map function returns the correct format.

### 3. Configure Color Overrides

To set specific colors for series:

1. Go to Panel → Overrides
2. Add override rule
3. Match by field name
4. Add property: Color → Fixed color
5. Choose color (green, yellow, red, blue, orange, etc.)

### 4. Export Dashboard from Grafana

1. Open your dashboard in Grafana
2. Click the **Share** icon (or Settings gear)
3. Select **Export**
4. Click **Save to file**
5. Download the JSON file (e.g., `my_dashboard.json`)

**Tip**: Use descriptive names for your dashboard files, e.g., `PegasGonda_cutting_analyse_dashboard.json`

## Importing Dashboards

### Method 1: Upload via Web Interface

1. Navigate to **Management → Dashboards**
2. Click **Upload JSON** button
3. Select your exported JSON file
4. The dashboard will be imported and appear in the dropdown

### Method 2: Manual File Placement

1. Copy your JSON file to:
   ```
   backend/resources/grafana/dashboard/
   ```
2. Restart the backend server
3. The dashboard will appear automatically

## Dashboard Management

### Viewing Dashboards

1. Go to **Management → Dashboards**
2. Select dashboard from the dropdown
3. Choose time range:
   - Last Hour
   - Last 6 Hours
   - Last 24 Hours
   - Last 7 Days
   - Last 30 Days
   - Last 90 Days (default)

### Editing Dashboard JSON

1. Enable **Edit Mode**
2. Click **Edit JSON** button
3. Modify the JSON structure
4. Use the search function (Ctrl+F / Cmd+F) to find specific fields
5. Click **Save Changes**

### Dashboard Operations

- **Refresh** - Reload all panel data
- **Download JSON** - Export current dashboard
- **Duplicate** - Create a copy with a new name
- **Delete** - Remove dashboard (creates backup)

## Query Variables

The application automatically replaces these Grafana variables:

- `v.timeRangeStart` → Selected start time (e.g., `-7d`)
- `v.timeRangeStop` → Selected stop time (e.g., `now()`)
- `v.windowPeriod` → Calculated aggregation window (e.g., `1d`, `1h`)

## Troubleshooting

### Dashboard Not Loading

- Check backend logs for errors
- Verify JSON file is valid (use JSON validator)
- Ensure InfluxDB connection is working

### No Data Displayed

- Verify Flux query syntax
- Check if data exists in InfluxDB for the selected time range
- Test query in InfluxDB Data Explorer first

### Wrong Colors/Appearance

- Check threshold configuration in panel fieldConfig
- Verify color overrides are using supported color names
- Ensure drawStyle is set correctly for time series

### Query Errors

Common issues:

1. **`_time` field error**: Use `_time` in keep() columns, or omit keep() entirely
2. **Empty results**: Check filter conditions and time range
3. **Column not found**: Verify column names after aggregateWindow and join operations

## Best Practices

1. **Test in Grafana First**: Always test your dashboard in Grafana before exporting
2. **Use Descriptive Names**: Name panels and dashboards clearly
3. **Optimize Queries**: Use appropriate aggregation windows for large time ranges
4. **Document Custom Queries**: Add comments in Flux queries explaining logic
5. **Version Control**: Keep exported JSON files in version control
6. **Backup Before Editing**: Use duplicate feature before making major changes

## Example Dashboard Structure

```json
{
  "dashboard": {
    "title": "Machine Monitoring",
    "panels": [
      {
        "id": 1,
        "title": "Belt Deviation",
        "type": "timeseries",
        "targets": [
          {
            "refId": "A",
            "query": "from(bucket: \"machine_data\")..."
          }
        ],
        "fieldConfig": {
          "defaults": {
            "custom": {
              "drawStyle": "line",
              "fillOpacity": 0
            },
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "value": null, "color": "green" },
                { "value": 0.5, "color": "yellow" },
                { "value": 1.0, "color": "red" }
              ]
            }
          }
        }
      }
    ]
  }
}
```

## Support

For additional help:
- Check API documentation at `/api/docs`
- Review README_BANDSAW.md
- Contact support at: support@pegasgonda.local
