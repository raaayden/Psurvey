import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";
import sha256 from "crypto-js/sha256.js";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  //   const { username } = await getQuery(event);
  const { username, email } = await readBody(event);

  if (!username || !email) {
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

  if (!validateUserExist) {
    return {
      statusCode: 400,
      message: "Username doenst exists",
    };
  }

  const editUser = await prisma.user.updateMany({
    where: {
      userUsername: username,
    },
    data: {
      userEmail: email,
    },
  });

  if (!editUser) {
    return {
      statusCode: 400,
      message: "User not found",
    };
  }

  return {
    statusCode: 200,
    message: "User updated",
  };
});
