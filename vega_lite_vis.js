const embedOpt = {
  actions: {
    export: true,
    source: true,
    compiled: true,
    editor: true
  }
};

vegaEmbed("#vis", "choropleth.json", embedOpt);
vegaEmbed("#barVis", "bar.json", embedOpt);
vegaEmbed("#lineVis", "line.json", embedOpt);
vegaEmbed("#scatterVis", "scatter.json", embedOpt);
vegaEmbed("#vehicleVis", "vehicle.json", embedOpt);
vegaEmbed("#bumpVis", "Bump.json", embedOpt);
vegaEmbed("#lollipopVis", "lolipop.json", embedOpt);
