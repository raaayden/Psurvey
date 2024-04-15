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
      userEmail: true,
      userrole: {
        select: {
          role: {
            select: {
              roleName: true,
            },
          },
        },
      },
    },
  });

  console.log("getUser Data: ", getUser);

  const remapRole = getUser.userrole.map((item) => {
    return item.role.roleName;
  });

  return {
    statusCode: 200,
    message: "API Route Created",
    data: {
      email: getUser.userEmail,
      role: remapRole,
    },
  };
});
