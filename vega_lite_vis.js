const TOPO_URL = "map.json"; 
const CSV_URL = "APIMS_yearly.csv";

const YEAR_FILTER = null; 

// Color bins
const COLOR_DOMAIN = [50, 100, 200];
const COLOR_RANGE = ["#2ecc71", "#f1c40f", "#e67e22", "#e67e22"];

async function init() {
  try {
    // 1) Load TopoJSON and detect object key
    const topo = await fetch(TOPO_URL).then((r) => r.json());
    const objectKeys = Object.keys(topo.objects || {});
    if (!objectKeys.length) throw new Error("No 'objects' in TopoJSON.");
    // Heuristic: pick the first object; adjust if your file has multiple objects
    const TOPO_OBJECT = objectKeys[0];
    console.log("Detected TopoJSON object:", TOPO_OBJECT);

    // 2) Build Vega-Lite spec using properties.Name
    const NORMALIZE_FINAL = `
      replace(
        replace(datum.properties.Name, "Federal Territory of ", ""),
        "Pulau Pinang", "Penang"
      )
    `;

    const spec = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      width: 960,
      height: 560,
      background: null,
      projection: {
        type: "mercator",
        center: [109.5, 4.5],
        scale: 2000,
        translate: [480, 280]
      },
      data: {
        url: TOPO_URL,
        format: { type: "topojson", feature: TOPO_OBJECT }
      },
      transform: [
        { calculate: NORMALIZE_FINAL, as: "state_key" },
        {
          lookup: "state_key",
          from: {
            data: { url: CSV_URL },
            key: "state",
            fields: ["api", "year"]
          }
        },
        ...(YEAR_FILTER == null
          ? []
          : [{ filter: `datum.year == ${YEAR_FILTER}` }])
      ],
      mark: { type: "geoshape", stroke: "#0f1115", strokeWidth: 0.8 },
      encoding: {
        color: {
          condition: {
            test: `isValid(datum['api']) && datum['api'] !== null`,
            field: "api",
            type: "quantitative",
            scale: {
              type: "threshold",
              domain: COLOR_DOMAIN,
              range: COLOR_RANGE
            }
          },
          value: "#cfcfcf"
        },
        tooltip: [
          { field: "properties.Name", title: "State" },
          //   { field: "state_key", title: "State (normalized)" },
          ...(YEAR_FILTER == null ? [{ field: "year", title: "Year" }] : []),
          { field: "api", type: "quantitative", title: "API (yearly)" }
        ]
      },
      config: {
        legend: {
          labelColor: "#d7dce5",
          titleColor: "#e8e8e8",
          gradientStrokeColor: "#999"
        },
        view: { stroke: null }
      }
    };

    await vegaEmbed("#vis", spec, { actions: false });
  } catch (err) {
    console.error("Failed to render map:", err);
    alert(
      "Map failed to load. "
    );
  }
}

init();
