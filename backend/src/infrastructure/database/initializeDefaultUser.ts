import prisma from "./prisma";
import { SystemBaseRoles } from "../../shared/constants";
import { INITIAL_USER_PASSWORD } from "../../configs";
import { hashPassword } from "../../shared/utils";

const defaultUserData = {
  dni     : "99999999",
  email   : "administrador@test.com",
  lastName: "EducaPro",
  name    : "Admin",
  password: INITIAL_USER_PASSWORD,
};

const initializeDefaultUser = async () => {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: defaultUserData.email },
  });
  if (!existingAdmin) {
    const hashedPassword = await hashPassword(defaultUserData.password);

    await prisma.user.create({
      data: {
        ...defaultUserData,
        password: hashedPassword,
        role    : {
          connectOrCreate: {
            create: { name: SystemBaseRoles.ADMIN },
            where : { name: SystemBaseRoles.ADMIN },
          },
        },
      },
    });
  }
};

export default initializeDefaultUser;
