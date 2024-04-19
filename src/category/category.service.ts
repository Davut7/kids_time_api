import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ITransformedFile } from 'src/helpers/common/interfaces/fileTransform.interface';
import { MediaService } from 'src/media/media.service';
import { unlink } from 'fs/promises';
import { CategoryEntity } from './entities/category.entity';
import { CategoryAttributesEntity } from './entities/categoryAttributes.entity';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { UpdateCategoryDto } from './dto/updateCategory.dto';
import { GetCategoriesQuery } from './dto/getCategories.dto';
import { CreateCategoryAttributeDto } from './dto/createCategoryAttribute.dto';
import { LanguageEnum } from 'src/helpers/constants';
import { UpdateCategoryAttributeDto } from './dto/updateCategoryAttribute.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(CategoryAttributesEntity)
    private categoryAttributesRepository: Repository<CategoryAttributesEntity>,
    private mediaService: MediaService,
    private dataSource: DataSource,
  ) {}

  async createCategory(dto: CreateCategoryDto) {
    const category = this.categoryRepository.create(dto);

    await this.categoryRepository.save(category);

    return {
      message: 'Category created successfully',
      category: category,
    };
  }

  async getCategories(query: GetCategoriesQuery) {
    const { page = 1, take = 10 } = query;
    const categoryQuery = this.categoryRepository
      .createQueryBuilder('categories')
      .leftJoinAndSelect('categories.medias', 'medias')
      .leftJoinAndSelect('categories.attributes', 'attributes');

    if (query.categoryType) {
      categoryQuery.where('categories.categoryType = :categoryType', {
        categoryType: query.categoryType,
      });
    }
    const [categories, count] = await categoryQuery
      .skip((page - 1) * take)
      .take(10)
      .getManyAndCount();

    return {
      categories: categories,
      categoriesCount: count,
    };
  }

  async getOneCategory(categoryId: string) {
    const category = await this.categoryRepository
      .createQueryBuilder('categories')
      .leftJoinAndSelect('categories.medias', 'medias')
      .leftJoinAndSelect('categories.attributes', 'attributes')
      .where('categories.id = :categoryId', { categoryId })
      .getOne();

    return category;
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.getOneCategory(categoryId);
    if (!category) throw new NotFoundException('category not found');
    Object.assign(category, dto);

    await this.categoryRepository.save(category);

    return {
      message: 'Category updated successfully',
      category: category,
    };
  }

  async deleteCategory(categoryId: string) {
    const category = await this.getOneCategory(categoryId);
    if (!category) throw new NotFoundException('Category not found');
    await this.categoryRepository.delete(category.id);

    return {
      message: 'Category deleted successfully',
    };
  }

  async uploadImage(file: ITransformedFile, categoryId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    const category = await this.getOneCategory(categoryId);
    if (!category) {
      await unlink(file.filePath);
    }
    let uploadedFileId: string;
    try {
      const mediaId = await this.mediaService.createFileMedia(
        file,
        categoryId,
        queryRunner,
        'categoryId',
      );
      uploadedFileId = mediaId;
      await queryRunner.commitTransaction();
      return {
        message: 'Images uploaded successfully',
      };
    } catch (error) {
      queryRunner.rollbackTransaction();
      await this.mediaService.deleteOneMedia(uploadedFileId, queryRunner);
      throw new InternalServerErrorException(error);
    } finally {
      queryRunner.release();
    }
  }

  async deleteImage(categoryId: string, mediaId: string) {
    await this.getOneCategory(categoryId);
    await this.mediaService.getOneMedia(mediaId);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    try {
      await this.mediaService.deleteOneMedia(mediaId, queryRunner);
      await queryRunner.commitTransaction();
      return {
        message: 'Image deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async createAttribute(dto: CreateCategoryAttributeDto, categoryId: string) {
    const candidate = await this.isAttributeUnique(dto.language, categoryId);
    if (candidate)
      throw new ConflictException(
        'Category attribute with this language already exists',
      );
    const attribute = this.categoryAttributesRepository.create({
      ...dto,
      categoryId: categoryId,
    });
    await this.categoryAttributesRepository.save(attribute);
    return {
      message: 'Category attribute with this language',
      attribute,
    };
  }

  async updateAttribute(
    categoryId: string,
    attributeId: string,
    dto: UpdateCategoryAttributeDto,
  ) {
    const attribute = await this.getOneAttribute(categoryId, attributeId);

    Object.assign(attribute, dto);

    await this.categoryAttributesRepository.save(attribute);

    return {
      message: 'Attribute updated successfully',
      attribute,
    };
  }

  async deleteAttribute(categoryId: string, attributeId: string) {
    const attribute = await this.getOneAttribute(categoryId, attributeId);

    await this.categoryAttributesRepository.delete(attribute.id);

    return {
      message: 'Attribute deleted  successfully',
    };
  }

  async getOneAttribute(categoryId: string, attributeId: string) {
    const attribute = await this.categoryAttributesRepository.findOne({
      where: { id: attributeId, categoryId: categoryId },
    });
    if (!attribute) throw new NotFoundException('Attribute not found');
    return attribute;
  }

  private async isAttributeUnique(language: LanguageEnum, categoryId: string) {
    const attribute = await this.categoryAttributesRepository
      .createQueryBuilder('attributes')
      .where(
        'attributes.language = :language AND attributes.categoryId = :categoryId',
        { language: language, categoryId },
      )
      .getOne();

    return attribute;
  }
}
