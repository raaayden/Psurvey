import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const getUser = await prisma.user.findMany({
    select: {
      userEmail: true,
      userUsername: true,
      userFullName: true,
    },
  });

  console.log("getUser Data: ", getUser);

  //   [{email: "email", username: "username", fullname: "fullname", action: 1}}]

  return {
    statusCode: 200,
    message: "GET List of User Success",
    data: getUser,
  };
});
