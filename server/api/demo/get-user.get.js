import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const { username } = await getQuery(event);
  // const body = await readBody(event);  || Get Body Data

  if (!username) {
    return {
      statusCode: 400,
      message: "No username provided",
    };
  }

  console.log("username Data: ", username);

  const getUser = await prisma.user.findFirst({
    where: {
      userUsername: username,
    },
    select: {
      userUsername: true,
      userEmail: true,
    },
  });

  if (!getUser) {
    return {
      statusCode: 404,
      message: "User not found",
    };
  }

  return {
    statusCode: 200,
    message: "User found",
    data: getUser,
  };
});
