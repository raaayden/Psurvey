import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";
import sha256 from "crypto-js/sha256.js";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  //   const { username } = await getQuery(event);
  const { username, password, email } = await readBody(event);

  if (!username || !password || !email) {
    return {
      statusCode: 400,
      message: "Invalid request",
    };
  }

  const validateUserExist = await prisma.user.findFirst({
    where: {
      userUsername: username,
    },
  });

  if (validateUserExist) {
    return {
      statusCode: 400,
      message: "Email or Username already exists",
    };
  }

  const hashedPassword = sha256(password).toString();

  const addUser = await prisma.user.create({
    data: {
      userUsername: username,
      userEmail: email,
      userPassword: hashedPassword,
      userrole: {
        create: {
          role: {
            connect: {
              roleID: 2,
            },
          },
          userRoleCreatedDate: DateTime.now(),
        },
      },
    },
  });

  console.log("addUser Data: ", addUser);

  return {
    statusCode: 200,
    message: "API Route Created",
    data: addUser,
  };
});
