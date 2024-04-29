export default [
  {
    header: "",
    description: "",
    child: [
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: "ic:outline-dashboard",
        child: [],
        meta: {},
      },
    ],
  },
  {
    header: "Parking Survey",
    description: "Manage Parking",
    child: [
      {
        title: "Prototype",
        path: "/psurvey/prototype",
        icon: "ph:app-window-duotone",
        child: [],
        meta: {},
      },
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
        path: "/survey/parking-season",
        icon: "mingcute:parking-line",
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
