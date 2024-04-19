export default [
  {
    "header": "",
    "description": "",
    "child": [
      {
        "title": "Dashboard",
        "path": "/dashboard",
        "icon": "ic:outline-dashboard",
        "child": [],
        "meta": {}
      },
      {
        "title": "Demo",
        "path": "/demo",
        "icon": "ph:person",
        "child": [],
        "meta": {}
      }
    ]
  },
  {
    "header": "Parking Survey",
    "description": "Manage Parking",
    "child": [
      {
        "title": "Parking Survey",
        "path": "/psurvey",
        "icon": "",
        "child": [
          {
            "title": "Add data",
            "path": "/psurvey/add_data",
            "icon": "",
            "child": []
          },
          {
            "title": "Add CSV",
            "path": "/psurvey/add_csv",
            "icon": "",
            "child": []
          },
          {
            "title": "List Data",
            "path": "/psurvey/list_data",
            "icon": "",
            "child": []
          },
          {
            "title": "Prototype",
            "path": "/psurvey/prototype",
            "icon": "ph:app-window-duotone",
            "child": [],
            "meta": {}
          }
        ]
      }
    ],
    "meta": {}
  },
  {
    "header": "User",
    "description": "Manage user",
    "child": [
      {
        "title": "User",
        "icon": "ph:users-duotone",
        "child": [
          {
            "title": "List",
            "path": "/user/list-user",
            "icon": "ph:users-four-thin",
            "child": [],
            "meta": {}
          },
          {
            "title": "Add",
            "path": "/user/add-user",
            "icon": "ph:plus-bold",
            "child": [],
            "meta": {}
          }
        ],
        "meta": {}
      }
    ],
    "meta": {}
  },
  {
    "header": "Administration",
    "description": "Manage your application",
    "child": [
      {
        "title": "Configuration",
        "icon": "ic:outline-settings",
        "child": [
          {
            "title": "Environment",
            "path": "/devtool/config/environment"
          }
        ]
      },
      {
        "title": "Menu Editor",
        "icon": "ci:menu-alt-03",
        "path": "/devtool/menu-editor",
        "child": []
      },
      {
        "title": "Manage Users",
        "path": "/devtool/user-management",
        "icon": "ph:user-circle-gear",
        "child": [
          {
            "title": "User List",
            "path": "/devtool/user-management/user-list",
            "icon": "",
            "child": []
          },
          {
            "title": "Role List",
            "path": "/devtool/user-management/role-list",
            "icon": "",
            "child": []
          }
        ]
      },
      {
        "title": "Content",
        "icon": "mdi:pencil-ruler",
        "child": [
          {
            "title": "Editor",
            "path": "/devtool/content-editor"
          },
          {
            "title": "Template",
            "path": "/devtool/content-editor/template"
          }
        ]
      },
      {
        "title": "API Editor",
        "path": "/devtool/api-editor",
        "icon": "material-symbols:api-rounded",
        "child": []
      }
    ],
    "meta": {
      "auth": {
        "role": [
          "Developer"
        ]
      }
    }
  },
  {
    "header": "Help",
    "description": "Help and documentation",
    "child": [
      {
        "title": "Documentation",
        "icon": "solar:book-bookmark-minimalistic-bold",
        "path": "https://mawar-cms-docs.vercel.app",
        "child": []
      },
      {
        "title": "UI Components",
        "icon": "material-symbols:settings-input-component-outline-rounded",
        "path": "https://roseui-nuxt.vercel.app"
      }
    ],
    "meta": {
      "auth": {
        "role": [
          "Developer"
        ]
      }
    }
  }
]