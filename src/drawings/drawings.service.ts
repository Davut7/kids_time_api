import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ITransformedFile } from 'src/helpers/common/interfaces/fileTransform.interface';
import { MediaService } from 'src/media/media.service';
import { unlink } from 'fs/promises';
import { LanguageEnum } from 'src/helpers/constants';
import { DrawingsEntity } from './entities/drawings.entity';
import { DrawingsAttributesEntity } from './entities/drawingsAttributes.entity';
import { CreateDrawingDto } from './dto/createDrawing.dto';
import { GetDrawingsQuery } from './dto/getDrawings.dto';
import { UpdateDrawingsDto } from './dto/updateDrawings.dto';
import { CreateDrawingsAttributeDto } from './dto/createDrawingAttribute.dto';
import { UpdateDrawingsAttributeDto } from './dto/updateDrawingsAttribute.dto';
import { UploadDrawingsDto } from './dto/uploadDrawings.dto';
import { CategoryEntity } from 'src/category/entities/category.entity';
import { DownloadDrawingsQuery } from './dto/downloadDrawing.query';
import { UserTokenDto } from 'src/client/token/dto/token.dto';

@Injectable()
export class DrawingsService {
  constructor(
    @InjectRepository(DrawingsEntity)
    private drawingsRepository: Repository<DrawingsEntity>,
    @InjectRepository(DrawingsAttributesEntity)
    private drawingsAttributesRepository: Repository<DrawingsAttributesEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    private mediaService: MediaService,
    private dataSource: DataSource,
  ) {}

  async createDrawing(dto: CreateDrawingDto, categoryId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    const drawing = this.drawingsRepository.create({
      ...dto,
      categoryId: categoryId,
    });

    await this.drawingsRepository.save(drawing);

    return {
      message: 'drawings created successfully',
      drawings: drawing,
    };
  }

  async getDrawings(query: GetDrawingsQuery) {
    const { page = 1, take = 10, q = '', lng = LanguageEnum.en } = query;
    const drawingsQuery = this.drawingsRepository
      .createQueryBuilder('drawings')
      .leftJoinAndSelect('drawings.medias', 'medias')
      .leftJoinAndSelect('drawings.attributes', 'attributes');
    if (q) {
      drawingsQuery.where(
        'attributes.title ILIKE :q AND attributes.language = :lng',
        {
          q: `%${q}%`,
          lng,
        },
      );
    }
    const [drawings, count] = await drawingsQuery
      .skip((page - 1) * take)
      .take(10)
      .getManyAndCount();

    return {
      drawings: drawings,
      drawingsCount: count,
    };
  }

  async getOneDrawing(drawingId: string, currentUser?: UserTokenDto) {
    const drawing = await this.drawingsRepository
      .createQueryBuilder('drawings')
      .leftJoinAndSelect('drawings.medias', 'medias')
      .leftJoinAndSelect('drawings.attributes', 'attributes')
      .where('drawings.id = :drawingId', { drawingId })
      .getOne();
    if (drawing.requiredLevel > currentUser?.level)
      throw new ForbiddenException('Your level is too low');
    if (!drawing) throw new NotFoundException('Drawings not found');
    return drawing;
  }

  async updateDrawing(drawingId: string, dto: UpdateDrawingsDto) {
    const drawing = await this.getOneDrawing(drawingId);
    Object.assign(drawing, dto);

    await this.drawingsRepository.save(drawing);

    return {
      message: 'Drawing updated successfully',
      drawing: drawing,
    };
  }

  async deleteDrawing(drawingId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    const drawing = await this.getOneDrawing(drawingId);
    let drawingMediaIds: string[] = [];
    for (const media of drawing.medias) {
      drawingMediaIds.push(media.id);
    }
    try {
      await this.drawingsRepository.delete(drawing.id);
      return {
        message: 'Drawing deleted successfully',
      };
    } catch (error) {
      queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await this.mediaService.deleteMedias(drawingMediaIds, queryRunner);
      queryRunner.release();
    }
  }

  async uploadMedia(
    file: ITransformedFile,
    drawingId: string,
    dto: UploadDrawingsDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    const drawing = await this.getOneDrawing(drawingId);
    let uploadedFileId: string;
    for (const media of drawing.medias) {
      if (media.mediaLng === dto.lng)
        throw new ConflictException('You already have a book in this language');
    }
    try {
      const mediaId = await this.mediaService.createFileMedia(
        file,
        drawingId,
        queryRunner,
        'drawingId',
        dto.lng,
      );
      uploadedFileId = mediaId;
      await queryRunner.commitTransaction();
      return {
        message: 'Book uploaded successfully',
      };
    } catch (error) {
      queryRunner.rollbackTransaction();
      await unlink(file.filePath);
      await this.mediaService.deleteOneMedia(uploadedFileId, queryRunner);
      throw new InternalServerErrorException(error);
    } finally {
      queryRunner.release();
    }
  }

  async deleteMedia(drawingId: string, mediaId: string) {
    await this.getOneDrawing(drawingId);
    await this.mediaService.getOneMedia(mediaId);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    try {
      await this.mediaService.deleteOneMedia(mediaId, queryRunner);
      await queryRunner.commitTransaction();
      return {
        message: 'Drawing deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async createAttribute(dto: CreateDrawingsAttributeDto, drawingId: string) {
    const candidate = await this.isAttributeUnique(dto.language, drawingId);
    if (candidate)
      throw new ConflictException(
        'drawings attribute with this language already exists',
      );
    const attribute = this.drawingsAttributesRepository.create({
      ...dto,
      drawingId: drawingId,
    });
    await this.drawingsAttributesRepository.save(attribute);
    return {
      message: 'drawings attribute with this language',
      attribute,
    };
  }

  async updateAttribute(
    drawingId: string,
    attributeId: string,
    dto: UpdateDrawingsAttributeDto,
  ) {
    const attribute = await this.getOneAttribute(drawingId, attributeId);

    Object.assign(attribute, dto);

    await this.drawingsAttributesRepository.save(attribute);

    return {
      message: 'Attribute updated successfully',
      attribute,
    };
  }

  async deleteAttribute(drawingId: string, attributeId: string) {
    const attribute = await this.getOneAttribute(drawingId, attributeId);

    await this.drawingsAttributesRepository.delete(attribute.id);

    return {
      message: 'Attribute deleted  successfully',
    };
  }

  async getOneAttribute(drawingId: string, attributeId: string) {
    const attribute = await this.drawingsAttributesRepository.findOne({
      where: { id: attributeId, drawingId: drawingId },
    });
    if (!attribute) throw new NotFoundException('Attribute not found');
    return attribute;
  }

  private async isAttributeUnique(language: LanguageEnum, drawingId: string) {
    const attribute = await this.drawingsAttributesRepository
      .createQueryBuilder('attributes')
      .where(
        'attributes.language = :language AND attributes.drawingId = :drawingId',
        { language: language, drawingId },
      )
      .getOne();

    return attribute;
  }

  async downloadDrawing(
    drawingId: string,
    drawingLanguage: DownloadDrawingsQuery,
  ) {
    await this.getOneDrawing(drawingId);
    const media = await this.mediaService.getMediaByLng(
      'drawingId',
      drawingId,
      drawingLanguage.drawingLng,
    );

    return media;
  }
}
