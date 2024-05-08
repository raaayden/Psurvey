export default defineEventHandler(async (event) => {
  try {
    const listProjectName = await prisma.project.findMany({
      select: {
        project_id: true,
        project_name: true,
      },
    });

    if (listProjectName.length === 0) {
      return {
        statusCode: 404,
        message: "Not Found",
      };
    }

    return {
      statusCode: 200,
      message: "Success get list project name",
      data: listProjectName,
    };
  } catch (error) {
    console.error("Error: ", error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
    };
  }
});
