import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Patch,
  UploadedFile,
  UseInterceptors,
  Body,
  ParseUUIDPipe,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  getSchemaPath,
  ApiOperation,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { CategoryService } from './category.service';
import { CategoryEntity } from './entities/category.entity';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { UpdateCategoryDto } from './dto/updateCategory.dto';
import { GetCategoriesQuery } from './dto/getCategories.dto';
import { CreateCategoryAttributeDto } from './dto/createCategoryAttribute.dto';
import { CategoryAttributesEntity } from './entities/categoryAttributes.entity';
import { UpdateCategoryAttributeDto } from './dto/updateCategoryAttribute.dto';
import { ImageTransformer } from '../helpers/pipes/imageTransform.pipe';
import { ITransformedFile } from '../helpers/common/interfaces/fileTransform.interface';
import { imageFilter } from '../helpers/filters/imageFilter';
import { ADMIN_AUTH } from '../helpers/common/decorators/adminAuth.decorator';
import { PUBLIC } from '../helpers/common/decorators/isPublic.decorator';


@ApiTags('category')
@ApiBearerAuth()
@Controller('/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({
    summary: 'Create Category',
    description: 'Create a new category.',
  })
  @ApiCreatedResponse({
    description: 'Category created successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Category created successfully.' },
        category: { $ref: getSchemaPath(CategoryEntity) },
      },
    },
  })
  @ADMIN_AUTH()
  @Post('')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(dto);
  }

  @ApiOperation({
    summary: 'Get Categories',
    description: 'Retrieve a list of categories',
  })
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
  @PUBLIC()
  @Get()
  async getCategories(@Query() query: GetCategoriesQuery) {
    return this.categoryService.getCategories(query);
  }

  @ApiOperation({
    summary: 'Get Category by ID',
    description: 'Retrieve a single category by its ID',
  })
  @ApiOkResponse({
    description: 'Single category retrieved successfully.',
    type: CategoryEntity,
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found!',
  })
  @ApiParam({ name: 'categoryId', description: 'Category id' })
  @PUBLIC()
  @Get('/:categoryId')
  async getOneCategory(@Param('categoryId') categoryId: string) {
    return await this.categoryService.getOneCategory(categoryId);
  }

  @ApiOperation({
    summary: 'Update Category',
    description: 'Update an existing category.',
  })
  @ApiOkResponse({
    description: 'Category updated successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Category updated successfully.' },
        category: { $ref: getSchemaPath(CategoryEntity) },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found!',
  })
  @ApiParam({ name: 'id', description: 'Category id' })
  @ADMIN_AUTH()
  @Patch('/:categoryId')
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(categoryId, dto);
  }

  @ApiOperation({
    summary: 'Delete Category',
    description: 'Delete an existing category',
  })
  @ApiOkResponse({
    description: 'Category deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Category deleted successfully.' },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found!',
  })
  @ApiParam({ name: 'categoryId', description: 'Category id' })
  @ADMIN_AUTH()
  @Delete('/:categoryId')
  async deleteCategory(@Param('categoryId') categoryId: string) {
    return this.categoryService.deleteCategory(categoryId);
  }

  @ApiOperation({
    summary: 'Upload Category Image',
    description: 'Upload an image for a category',
  })
  @ApiOkResponse({ description: 'Category image uploaded successfully.' })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found!',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading category image!',
  })
  @ApiConsumes('multipart/form-data')
  @ADMIN_AUTH()
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

  @ApiOperation({
    summary: 'Delete Category Image',
    description: 'Delete an image of a category',
  })
  @ApiOkResponse({
    description: 'Category image uploaded successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Category image deleted successfully.',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Category not found!',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading category image',
    type: InternalServerErrorException,
  })
  @ADMIN_AUTH()
  @Delete('/:categoryId/image/:imageId')
  async deleteCategoryImage(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.categoryService.deleteImage(categoryId, imageId);
  }

  @ApiOperation({
    summary: 'Create Category Attribute',
    description: 'Create a new attribute for a category',
  })
  @ApiCreatedResponse({
    description: 'Category attribute created successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Category attribute created successfully.',
        },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(CategoryAttributesEntity),
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Category attribute with this language already exists!',
  })
  @ADMIN_AUTH()
  @Post('/attributes/:categoryId')
  async createAttribute(
    @Body() dto: CreateCategoryAttributeDto,
    @Param('categoryId') categoryId: string,
  ) {
    return this.categoryService.createAttribute(dto, categoryId);
  }

  @ApiOperation({
    summary: 'Update Category Attribute',
    description: 'Update an existing attribute of a category',
  })
  @ApiOkResponse({
    description: 'Category attribute updated successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Attribute updated successfully.' },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(CategoryAttributesEntity),
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found!',
  })
  @ADMIN_AUTH()
  @Patch('/:categoryId/attributes/:attributeId')
  async updateAttribute(
    @Param('categoryId') categoryId: string,
    @Param('attributeId') attributeId: string,
    @Body() dto: UpdateCategoryAttributeDto,
  ) {
    return this.categoryService.updateAttribute(categoryId, attributeId, dto);
  }

  @ApiOperation({
    summary: 'Delete Category Attribute',
    description: 'Delete an attribute of a category',
  })
  @ApiOkResponse({
    description: 'Category attribute deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found!',
  })
  @ADMIN_AUTH()
  @Delete('/:categoryId/attributes/:attributeId')
  async deleteAttribute(
    @Param('categoryId') categoryId: string,
    @Param('attributeId') attributeId: string,
  ) {
    return this.categoryService.deleteAttribute(categoryId, attributeId);
  }
}
