const TOPO_URL = "map.json";
const CSV_URL = "APIMS_yearly.csv";
const YEAR_FILTER = 2022;

const COLOR_DOMAIN = [50, 100, 200];
const COLOR_RANGE = ["#2ecc71", "#f1c40f", "#e67e22", "#e74c3c"];

async function drawMap() {
  const topo = await fetch(TOPO_URL).then((r) => r.json());
  const TOPO_OBJECT = Object.keys(topo.objects)[0];

  const NORMALIZE = `
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
    projection: { type: "equirectangular", center: [110, 3], scale: 2000 },
    layer: [
      { data: { sphere: true }, mark: { type: "geoshape", fill: "#a9d5f5ff" } },
      {
        data: { graticule: { step: [20, 20] } },
        mark: {
          type: "geoshape",
          stroke: "#b8c4d1",
          strokeWidth: 0.5,
          opacity: 0.7
        }
      },
      {
        data: {
          url: "https://vega.github.io/vega-datasets/data/world-110m.json",
          format: { type: "topojson", feature: "countries" }
        },
        mark: {
          type: "geoshape",
          fill: "#e7eef5",
          stroke: "#c7d1dc",
          strokeWidth: 0.5
        }
      },
      {
        data: {
          url: TOPO_URL,
          format: { type: "topojson", feature: TOPO_OBJECT }
        },
        transform: [
          { calculate: NORMALIZE, as: "state_key" },
          {
            lookup: "state_key",
            from: {
              data: { url: CSV_URL },
              key: "state",
              fields: ["api", "year"]
            }
          },
          { filter: `datum.year == ${YEAR_FILTER}` }
        ],
        mark: { type: "geoshape", stroke: "#0f1115", strokeWidth: 0.8 },
        encoding: {
          color: {
            condition: {
              test: "isValid(datum.api)",
              field: "api",
              type: "quantitative",
              scale: {
                type: "threshold",
                domain: COLOR_DOMAIN,
                range: COLOR_RANGE
              }
            },
            value: "#cccccc"
          },
          tooltip: [
            { field: "properties.Name", title: "State" },
            { field: "api", title: "API (2022)", format: ".1f" }
          ]
        }
      }
    ],
    config: { view: { stroke: null } }
  };

  await vegaEmbed("#vis", spec, { actions: false });
}

async function drawBar() {
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 420,
    data: { url: CSV_URL },

    transform: [
      { calculate: "lower(trim(datum.state))", as: "state_norm" },
      {
        calculate: "toNumber(replace(trim(datum.api), /,/g, ''))",
        as: "api_num"
      },
      {
        calculate: "toNumber(replace(trim(datum.year), /,/g, ''))",
        as: "year_num"
      },
      { filter: "isValid(datum.api_num) && isFinite(datum.api_num)" },

      { calculate: "lower(pState)", as: "pstate_norm" },
      { filter: "datum.state_norm == datum.pstate_norm" }
    ],

    // Dropdown of states
    params: [
      {
        name: "pState",
        value: "Johor", // default
        bind: {
          input: "select",
          name: "Select State: ",
          options: [
            "Johor",
            "Kedah",
            "Kelantan",
            "Kuala Lumpur",
            "Labuan",
            "Melaka",
            "Negeri Sembilan",
            "Pahang",
            "Penang",
            "Perak",
            "Perlis",
            "Putrajaya",
            "Sabah",
            "Sarawak",
            "Selangor",
            "Terengganu"
          ]
        }
      }
    ],

    layer: [
      // Bars
      {
        mark: { type: "bar" },
        encoding: {
          x: {
            field: "year_num",
            type: "ordinal",
            title: "Year",
            sort: "ascending"
          },
          y: {
            field: "api_num",
            type: "quantitative",
            title: "API",
            scale: { nice: true }
          },
          tooltip: [
            { field: "state", title: "State" },
            { field: "year_num", title: "Year", format: "d" },
            { field: "api_num", title: "API", format: ",.1f" }
          ]
        }
      },

      // Mean line
      {
        transform: [
          { aggregate: [{ op: "mean", field: "api_num", as: "mean_api" }] },
          {
            calculate: "'Mean: ' + format(datum.mean_api, ',.1f')",
            as: "mean_label"
          }
        ],
        mark: {
          type: "rule",
          strokeDash: [6, 4],
          strokeWidth: 2,
          color: "#555"
        },
        encoding: { y: { field: "mean_api", type: "quantitative" } }
      },
      // Mean label
      {
        transform: [
          { aggregate: [{ op: "mean", field: "api_num", as: "mean_api" }] },
          {
            calculate: "'Mean: ' + format(datum.mean_api, ',.1f')" + "",
            as: "mean_label"
          }
        ],
        mark: {
          type: "text",
          dy: -6,
          x: 18,
          align: "left",
          color: "#333",
          fontWeight: "bold"
        },
        encoding: {
          y: { field: "mean_api", type: "quantitative" },
          text: { field: "mean_label" }
        }
      },

      {
        transform: [
          {
            window: [{ op: "rank", as: "r" }],
            sort: [{ field: "api_num", order: "descending" }]
          },
          { filter: "datum.r == 1" },
          { calculate: "'Max, due to haze in 2019'", as: "labelText" }
        ],
        mark: { type: "text", dy: -6, color: "#111", fontWeight: "bold" },
        encoding: {
          x: { field: "year_num", type: "ordinal" },
          y: { field: "api_num", type: "quantitative" },
          text: { field: "labelText" }
        }
      }
    ],

    config: { view: { stroke: null } }
  };

  await vegaEmbed("#barVis", spec, { actions: false });
}

drawMap();
drawBar();
