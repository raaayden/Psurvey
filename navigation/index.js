export default [
  {
    header: "",
    description: "",
    child: [
      {
        title: "Upload CSV",
        path: "/survey/upload-csv",
        icon: "ph:file-csv",
      },
      {
        title: "List Survey Data",
        path: "/survey/list",
        icon: "ph:file-text-duotone",
      },
      {
        title: "Parking Season",
        icon: "mingcute:parking-line",
        child: [
          {
            title: "List",
            path: "/survey/parking-season",
          },
          {
            title: "Add Vehicle to Parking Season",
            path: "/survey/parking-season/add-vehicle",
          },
        ],
      },
      {
        title: "Report",
        icon: "material-symbols:insert-chart-outline",
        child: [
          {
            title: "Traffic Matching",
            path: "/survey/report/traffic-matching",
            icon: "",
            child: [],
          },
          {
            title: "Average Length of Stay",
            path: "/survey/report/average-length-of-stay",
            icon: "",
          },
          {
            title: "Vehicle Movement & Bay Utilization",
            path: "/survey/report/vehicle-movement-bay-utilization",
          },
          {
            title: "Multiple Entry",
            path: "/survey/report/multiple-entry",
          },
          {
            title: "Season Parking",
            path: "/survey/report/season-parking",
          },
        ],
      },
    ],
    meta: {},
  },
];
