import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { imageFilter } from 'src/helpers/filters/imageFilter';
import { ITransformedFile } from 'src/helpers/common/interfaces/fileTransform.interface';
import { CategoryService } from './category.service';
import { CategoryEntity } from './entities/category.entity';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { UpdateCategoryDto } from './dto/updateCategory.dto';
import { ImageTransformer } from 'src/helpers/pipes/imageTransform.pipe';
import { GetCategoriesQuery } from './dto/getCategories.dto';
import { CreateCategoryAttributeDto } from './dto/createCategoryAttribute.dto';
import { CategoryAttributesEntity } from './entities/categoryAttributes.entity';
import { UpdateCategoryAttributeDto } from './dto/updateCategoryAttribute.dto';
import { AdminAuthGuard } from 'src/helpers/guards/adminAuth.guard';

@ApiTags('category')
@ApiBearerAuth()
@Controller('/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiCreatedResponse({
    description: 'Category created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Category created successfully' },
        category: { $ref: getSchemaPath(CategoryEntity) },
      },
    },
  })
  @UseGuards(AdminAuthGuard)
  @Post('')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(dto);
  }

  @ApiOkResponse({
    description: 'List of categories',
    schema: {
      type: 'object',
      properties: {
        properties: { items: { $ref: getSchemaPath(CategoryEntity) } },
        propertiesCount: { type: 'number' },
      },
    },
  })
  @Get()
  async getCategories(@Query() query: GetCategoriesQuery) {
    return this.categoryService.getCategories(query);
  }

  @ApiOkResponse({
    description: 'Single category retrieved successfully',
    type: CategoryEntity,
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found',
  })
  @ApiParam({ name: 'categoryId', description: 'Category id' })
  @Get('/:categoryId')
  async getOneCategory(@Param('categoryId') categoryId: string) {
    return this.categoryService.getOneCategory(categoryId);
  }

  @ApiOkResponse({
    description: 'Category updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Category updated successfully' },
        category: { $ref: getSchemaPath(CategoryEntity) },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found',
  })
  @ApiParam({ name: 'id', description: 'Category id' })
  @UseGuards(AdminAuthGuard)
  @Patch('/:categoryId')
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(categoryId, dto);
  }

  @ApiOkResponse({
    description: 'Category deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Category deleted successfully' },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found',
  })
  @ApiParam({ name: 'categoryId', description: 'Category id' })
  @UseGuards(AdminAuthGuard)
  @Delete('/:categoryId')
  async deleteCategory(@Param('categoryId') categoryId: string) {
    return this.categoryService.deleteCategory(categoryId);
  }

  @ApiOkResponse({ description: 'Category image uploaded successfully' })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading category image',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AdminAuthGuard)
  @Post('/images/:categoryId')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, cb) => {
          const uniqueFileName =
            randomUUID() + `_uploaded_${file.originalname}`;
          cb(null, uniqueFileName);
        },
      }),
      fileFilter: imageFilter,
      limits: { fileSize: 1024 * 1024 * 15 },
    }),
  )
  async uploadImages(
    @UploadedFile(ImageTransformer) file: ITransformedFile,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoryService.uploadImage(file, categoryId);
  }

  @ApiOkResponse({
    description: 'Category image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Category image deleted successfully',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading category image',
    type: InternalServerErrorException,
  })
  @UseGuards(AdminAuthGuard)
  @Delete('/:categoryId/image/:imageId')
  async deleteCategoryImage(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.categoryService.deleteImage(categoryId, imageId);
  }

  @ApiCreatedResponse({
    description: 'Category attribute created successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Category attribute created successfully',
        },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(CategoryAttributesEntity),
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Category attribute with this language already exists',
  })
  @UseGuards(AdminAuthGuard)
  @Post('/attributes/:categoryId')
  async createAttribute(
    @Body() dto: CreateCategoryAttributeDto,
    @Param('categoryId') categoryId: string,
  ) {
    return this.categoryService.createAttribute(dto, categoryId);
  }

  @ApiOkResponse({
    description: 'Category attribute updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Attribute updated successfully' },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(CategoryAttributesEntity),
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found',
  })
  @UseGuards(AdminAuthGuard)
  @Patch('/:categoryId/attributes/:attributeId')
  async updateAttribute(
    @Param('categoryId') categoryId: string,
    @Param('attributeId') attributeId: string,
    @Body() dto: UpdateCategoryAttributeDto,
  ) {
    return this.categoryService.updateAttribute(categoryId, attributeId, dto);
  }

  @ApiOkResponse({
    description: 'Category attribute deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found',
  })
  @UseGuards(AdminAuthGuard)
  @Delete('/:categoryId/attributes/:attributeId')
  async deleteAttribute(
    @Param('categoryId') categoryId: string,
    @Param('attributeId') attributeId: string,
  ) {
    return this.categoryService.deleteAttribute(categoryId, attributeId);
  }
}
