import { User } from "@prisma/client";
import { SystemBaseRoles, SystemGenders } from "../../../shared/constants";
import { comparePassword, hashPassword } from "../../../shared/utils";
import generatePassword from "../../../shared/utils/generatePassword.utils";
import { RoleRepository } from "../../role/repositories/role.repository";
import { RegisterUserDto } from "../dtos/create.dto";
import { FilterUsers, FindUsersOptionsDto, orders, SelectUserDto, UserProfileDto } from "../dtos/select.dto";
import { UpdateEmailDto, UpdatePasswordDto, UpdateUserDataDto } from "../dtos/update.dto";
import { UserRepository } from "../repositories/user.repository";
import { Paginated } from "../../../shared/interfaces/Paginated";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository
  ) {}

  async createUser(dto: RegisterUserDto) {
    const existingRole = await this.roleRepository.findById(dto.roleId);
    if (!existingRole) throw Error("Role does not exists");

    if(dto.gender)
      this.validateGenderOrThrow(dto.gender);

    dto.gender = SystemGenders.OTHER;

    await this.validateDniOrThrow(dto.dni);
    await this.validateEmailOrThrow(dto.email);

    const generatedPassword = generatePassword();
    const password = await hashPassword(generatedPassword);

    const birthDate = dto.birthDate ? new Date(dto.birthDate) : new Date();
    const newUser = await this.userRepository.createUser({ ...dto, birthDate, password });

    return { ...newUser, password: generatedPassword };
  }

  async updateUser(
    userId: string,
    dto: UpdateUserDataDto
  ): Promise<SelectUserDto> {
    const existingUser = await this.getUserByIdOrThrow(userId, true);
    console.log(dto);
    if(dto.gender)
      this.validateGenderOrThrow(dto.gender);

    if (dto.roleId) {
      const existingRole = await this.roleRepository.findById(dto.roleId);
      if (!existingRole) throw Error("Role does not exists");
      if (
        existingUser &&
        existingUser.role == SystemBaseRoles.ADMIN &&
        existingRole.id != dto.roleId
      ) {
        const countAdmins = await this.userRepository.countActivesByRole(
          SystemBaseRoles.ADMIN
        );
        if (countAdmins <= 1) throw Error("Cannot change this user role");
      }
    }

    await this.validateDniOrThrow(dto.dni, userId);
    await this.validateEmailOrThrow(dto.email, userId);

    const updatedUser = await this.userRepository.updateUser(userId, dto);
    return {
      ...updatedUser,
      password: undefined,
      role    : updatedUser?.role?.name,
    } as SelectUserDto;
  }

  private async getUserByIdOrThrow(
    userId: string,
    isActive?: boolean
  ): Promise<SelectUserDto & {password:string}> {
    const user = await this.userRepository.findUserById(userId, isActive);
    if (!user) throw Error("User not found");

    return {
      ...user,
      role: user.role!.name,
    };
  }

  async getUserById(userId:string):Promise<SelectUserDto>{
    const user = await this.getUserByIdOrThrow(userId, true);
    return { ...user, password: undefined } as SelectUserDto;
  }

  async getUsers(findOptions: FindUsersOptionsDto): Promise<Paginated<SelectUserDto>> {
    const { isActive, page, limit, orderBy, role, s, sort } = findOptions;
    
    const filterOptions:FilterUsers = {
      isActive: !isActive
        ? undefined
        : isActive === "1"
          ? true
          : false,
      pagOptions: {
        limit  : (limit && isNaN(parseInt(limit))) || !limit ? 15 : parseInt(limit),
        orderBy: orderBy && orders.includes(orderBy) ? orderBy as keyof User : undefined,
        page   : isNaN(parseInt(page)) ? 1 : parseInt(page),
        sort   : !sort && orderBy ? "asc" : sort =="asc" || sort == "desc" ? sort : undefined
      },
      role       : role ? role.toUpperCase() as SystemBaseRoles : undefined,
      searchParam: s?s:undefined
    };

    const users = await this.userRepository.findUsersAndCount(filterOptions);
    const usersData =  users.data.map((user) => {
      return { ...user, gender: user.gender as SystemGenders, password: undefined, role: user.role.name };
    });
    return {
      content: usersData,
      meta   : {
        currentPage: filterOptions.pagOptions.page!,
        pageSize   : filterOptions.pagOptions.limit as number,
        total      : users.count,
        totalPages : Math.ceil(users.count / filterOptions.pagOptions.limit!),
      },
    };
  }

  async softDeleteUser(userId: string) {
    const user = await this.getUserByIdOrThrow(userId, true);
    if (user.name === SystemBaseRoles.ADMIN) {
      const countAdmins = await this.roleRepository.countByRole(
        SystemBaseRoles.ADMIN
      );
      if (countAdmins <= 1) throw Error("Cannot delete this user");
    }
    const updatedUser = await this.userRepository.updateUser(userId, {
      deletedAt: new Date(),
      isActive : false,
      password : "#deleted",
    });
    return updatedUser;
  }

  async updatePassword(userId:string, updatePassDto: UpdatePasswordDto) {
    if(updatePassDto.newPassword != updatePassDto.newPasswordConfirm)
      throw Error("Las nuevas contraseñas no coinciden");
    const user = await this.getUserByIdOrThrow(userId, true);
    const isPassword = await comparePassword(updatePassDto.password, user.password);
    if(!isPassword)
      throw Error("Contraseña incorrecta");
    const newHash = await hashPassword(updatePassDto.newPassword);
    await this.userRepository.updateUser(userId, { password: newHash });
    return true;
  }

  async updateEmail(userId:string, updateEmailDto: UpdateEmailDto){
    const user = await this.getUserByIdOrThrow(userId, true);
    const isPassword = await comparePassword(updateEmailDto.password, user.password);
    if(!isPassword)
      throw Error("Contraseña incorrecta");
    await this.validateEmailOrThrow(updateEmailDto.newEmail, userId);

    await this.userRepository.updateUser(userId, { email: updateEmailDto.newEmail });
    return true;
  }

  async userProfile(userId:string): Promise<UserProfileDto>{
    const user = await this.getUserByIdOrThrow(userId, true);
    const userProfile = {
      ...user,
      createdAt: undefined,
      deletedAt: undefined,
      isActive : undefined,
      password : undefined,
      roleId   : undefined,
      updatedAt: undefined
    } as UserProfileDto;
    return userProfile;
  }

  private async validateDniOrThrow(userDni?: string, userId?: string) {
    if (userDni) {
      const existingDni = await this.userRepository.findUserByDni(userDni);
      if (userId && existingDni && existingDni.id === userId) return;
      if (existingDni) throw Error("DNI already registered");
    }
  }

  private async validateEmailOrThrow(userEmail?: string, userId?: string) {
    if (userEmail) {
      const existingEmail = await this.userRepository.findUserByEmail(
        userEmail
      );
      if (userId && existingEmail && existingEmail.id === userId) return;
      if (existingEmail) throw Error("Email already in use");
    }
  }

  private validateGenderOrThrow(toValidate:string) {
    if(!Object.values(SystemGenders).includes(toValidate as SystemGenders))
      throw Error("Gender not valid");
  }
}
