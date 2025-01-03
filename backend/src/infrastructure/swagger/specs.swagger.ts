/* eslint-disable key-spacing */
/* eslint-disable sort-keys-fix/sort-keys-fix */
import swaggerJsdoc from "swagger-jsdoc";
import { API_URL, PORT } from "../../configs";
import { authPaths, authSchemas } from "./auth";
import { errorResponseSchema } from "./responses.swagger";
import { SwaggerOptions } from "swagger-ui-express";
import { userSchemas } from "./user/schemas.swagger";
import { roleSchemas } from "./role/schemas.swagger";
import { rolePaths } from "./role";
import { userPaths } from "./user";
import { bulletinPaths, bulletinSchemas } from "./bulletin";
import { classPaths, classSchemas } from "./class";
import { subjectPaths, subjectSchemas } from "./subject";
import { attendancePaths, attendanceSchemas } from "./attendance";
import { attendanceStudentPaths, attendanceStudentSchemas } from "./attendanceStudent";
import { enrollmentPaths, enrollmentSchemas } from "./enrollments";
import { subjectCategoryPaths, subjectCategorySchemas } from "./subject-category";
import { divisionPaths, divisionSchemas } from "./division";
import { activityPaths, activitySchemas } from "./activity";

export const swaggerOptions: SwaggerOptions = {
  swaggerOptions: {
    requestInterceptor: (req: Request) => {
      const token = localStorage.getItem("token");
      if (token) req.headers.set("Authorization", `Bearer ${token}`);

      return req;
    },
  },
};

const options: swaggerJsdoc.OAS3Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Sistema de Gestión Académica v1",
      version: "1.0.0",
      description: "API para el Sistema de Gestión Académica",
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: "Servidor de desarrollo",
      },
      {
        url: `${API_URL}/api/v1`,
        description: "Servidor de prod",
      },
    ],
    paths: {
      ...authPaths,
      ...rolePaths,
      ...userPaths,
      ...bulletinPaths,
      ...classPaths,
      ...subjectPaths,
      ...subjectCategoryPaths,
      ...divisionPaths,
      ...attendancePaths,
      ...attendanceStudentPaths,
      ...enrollmentPaths,
      ...activityPaths
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Introduce el token JWT en el encabezado 'Authorization' como 'Bearer <token>'",
        },
      },
      schemas: {
        ...authSchemas,
        errorResponse: errorResponseSchema(),
        ...userSchemas,
        ...roleSchemas,
        ...bulletinSchemas,
        ...subjectSchemas,
        ...classSchemas,
        ...subjectCategorySchemas,
        ...divisionSchemas,
        ...attendanceSchemas,
        ...attendanceStudentSchemas,
        ...enrollmentSchemas,
        ...activitySchemas
      },
    },
  },
  apis: [],
};

export const swaggerUiSpecs = {
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js",
  ],
  customCssUrl: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
