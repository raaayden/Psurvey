export default defineEventHandler(async (event) => {
  try {
    const projectList = await prisma.project.findMany({
      select: {
        project_id: true,
        project_name: true,
      },
    });

    if (!projectList || projectList.length === 0) {
      return {
        statusCode: 404,
        message: "Project not found",
      };
    }

    const remapOptions = projectList.map((project) => {
      return {
        label: project.project_name,
        value: project.project_name,
      };
    });

    return {
      statusCode: 200,
      message: "Success get Project List",
      data: remapOptions,
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
