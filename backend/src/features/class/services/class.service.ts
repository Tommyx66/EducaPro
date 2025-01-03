import { Paginated } from "../../../shared/interfaces/Paginated";
import { Classes } from "../entities/class.entity";
import { IClassService } from "./IClass.service";
import { Paginate } from "../../../shared/utils";
import { IClassRepository } from "../repositories/Iclass.repository";
import { Prisma } from "@prisma/client";

export class ClassService implements IClassService {
  private readonly _classRepository: IClassRepository;

  constructor(classRepository: IClassRepository) {
    this._classRepository = classRepository;
  }
  private readonly includeOptions: Prisma.ClassInclude = {
    _count : { select: { activities: true } },
    subject: {
      select: { division: { select: { name: true } }, name: true },
    },
    year: { select: { year: true } },
  };
  async getAllClasses(
    page: number,
    size: number,
    filter?: Record<string, any>,
    sort?: Record<string, "asc" | "desc">
  ): Promise<Paginated<Classes>> {
    return await Paginate<Classes>("class", page, size, filter, sort, this.includeOptions);
  }

  async getClassById(id: string): Promise<Classes | null> {
    return await this._classRepository.findById(id, this.includeOptions);
  }

  async getClassByName(name: string): Promise<Classes | null> {
    return await this._classRepository.findByName(name, this.includeOptions);
  }

  async create(createDto: Classes): Promise<Classes> {
    return await this._classRepository.create(createDto);
  }

  async update(id: string, updateDto: Classes): Promise<Classes | null> {
    return await this._classRepository.update(id, updateDto);
  }

  async delete(id: string): Promise<void> {
    await this._classRepository.delete(id);
  }
}
