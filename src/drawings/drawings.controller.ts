import {
  Body,
  ConflictException,
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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { DrawingsService } from './drawings.service';
import { DrawingsEntity } from './entities/drawings.entity';
import { CreateDrawingDto } from './dto/createDrawing.dto';
import { GetDrawingsQuery } from './dto/getDrawings.dto';
import { UpdateDrawingsDto } from './dto/updateDrawings.dto';
import { UploadDrawingsDto } from './dto/uploadDrawings.dto';
import { DrawingsAttributesEntity } from './entities/drawingsAttributes.entity';
import { CreateDrawingsAttributeDto } from './dto/createDrawingAttribute.dto';
import { DownloadDrawingsQuery } from './dto/downloadDrawing.query';
import { CurrentUser } from '../helpers/common/decorators/currentUser.decorator';
import { UserTokenDto } from '../client/token/dto/token.dto';
import { PdfTransformer } from '../helpers/pipes/booksTransform.pipe';
import { ITransformedFile } from '../helpers/common/interfaces/fileTransform.interface';
import { ADMIN_AUTH } from '../helpers/common/decorators/adminAuth.decorator';
import { PUBLIC } from '../helpers/common/decorators/isPublic.decorator';
import { CLIENT_AUTH } from '../helpers/common/decorators/clientAuth.decorator';

@ApiTags('drawings')
@ApiBearerAuth()
@Controller('/drawings')
export class DrawingsController {
  constructor(private readonly drawingsService: DrawingsService) {}

  @ApiOperation({ summary: 'Create a new drawing' })
  @ApiCreatedResponse({
    description: 'Drawing created successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Drawing created successfully.' },
        drawings: { $ref: getSchemaPath(DrawingsEntity) },
      },
    },
  })
  @ApiConflictResponse({
    type: ConflictException,
    description: 'Drawing with this title already exists!',
  })
  @ADMIN_AUTH()
  @Post(':categoryId')
  async createDrawing(
    @Body() dto: CreateDrawingDto,
    @Param('categoryId') categoryId: string,
  ) {
    return this.drawingsService.createDrawing(dto, categoryId);
  }

  @ApiOperation({ summary: 'Get drawings' })
  @ApiOkResponse({
    description: 'Drawings returned successfully.',
    schema: {
      type: 'object',
      properties: {
        properties: { items: { $ref: getSchemaPath(DrawingsEntity) } },
        propertiesCount: { type: 'number' },
      },
    },
  })
  @CLIENT_AUTH()
  @Get()
  async getDrawings(@Query() query: GetDrawingsQuery) {
    return this.drawingsService.getDrawings(query);
  }

  @ApiOperation({ summary: 'Get a single drawing' })
  @ApiOkResponse({
    description: 'Single drawing retrieved successfully.',
    type: DrawingsEntity,
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawing not found!',
  })
  @ApiParam({ name: 'drawingId', description: 'drawing id' })
  @PUBLIC()
  @Get('/:drawingId')
  async getOneDrawing(
    @Param('drawingId') drawingsId: string,
    @CurrentUser() currentUser: UserTokenDto,
  ) {
    return this.drawingsService.getOneDrawing(drawingsId, currentUser);
  }

  @ApiOperation({ summary: 'Update a drawing' })
  @ApiOkResponse({
    description: 'Drawing updated successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Drawing updated successfully.' },
        drawings: { $ref: getSchemaPath(DrawingsEntity) },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawing not found!',
  })
  @ApiParam({ name: 'drawingId', description: 'drawing id' })
  @ADMIN_AUTH()
  @Patch('/:drawingId')
  async updateDrawings(
    @Param('drawingId') drawingId: string,
    @Body() dto: UpdateDrawingsDto,
  ) {
    return this.drawingsService.updateDrawing(drawingId, dto);
  }

  @ApiOperation({ summary: 'Delete a drawing' })
  @ApiOkResponse({
    description: 'Drawing deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Drawing deleted successfully!' },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawing not found!',
  })
  @ApiParam({ name: 'drawingId', description: 'drawing id' })
  @ADMIN_AUTH()
  @Delete('/:drawingId')
  async deleteDrawings(@Param('drawingId') drawingId: string) {
    return this.drawingsService.deleteDrawing(drawingId);
  }

  @ApiOperation({ summary: 'Upload media for a drawing' })
  @ApiOkResponse({ description: 'Drawing uploaded successfully.' })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawings not found!',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading drawing',
  })
  @ApiConsumes('multipart/form-data')
  @ADMIN_AUTH()
  @Post('/medias/:drawingId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, cb) => {
          const uniqueFileName =
            randomUUID() + `_uploaded_${file.originalname}`;
          cb(null, uniqueFileName);
        },
      }),
      // fileFilter: mediaFilter,
      limits: { fileSize: 1024 * 1024 * 1500 },
    }),
  )
  async uploadMedia(
    @UploadedFile(PdfTransformer) file: ITransformedFile,
    @Param('drawingId', ParseUUIDPipe) drawingId: string,
    @Body() dto: UploadDrawingsDto,
  ) {
    return this.drawingsService.uploadMedia(file, drawingId, dto);
  }

  @ApiOperation({ summary: 'Delete media of a drawing.' })
  @ApiOkResponse({
    description: 'Drawings media uploaded successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Drawings media deleted successfully.',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawings not found!',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading drawings',
    type: InternalServerErrorException,
  })
  @ADMIN_AUTH()
  @Delete('/:drawingId/media/:mediaId')
  async deleteDrawingsMedia(
    @Param('drawingId', ParseUUIDPipe) drawingId: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    return this.drawingsService.deleteMedia(drawingId, mediaId);
  }

  @ApiOperation({ summary: 'Create an attribute for a drawing.' })
  @ApiCreatedResponse({
    description: 'Drawings attribute created successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Drawings attribute created successfully.',
        },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(DrawingsAttributesEntity),
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Drawings attribute with this language already exists!',
  })
  @ADMIN_AUTH()
  @Post('/attributes/:drawingId')
  async createAttribute(
    @Body() dto: CreateDrawingsAttributeDto,
    @Param('drawingId') drawingId: string,
  ) {
    return this.drawingsService.createAttribute(dto, drawingId);
  }

  @ApiOperation({ summary: 'Update an attribute for a drawing.' })
  @ApiOkResponse({
    description: 'Drawings attribute updated successfully.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Attribute updated successfully.' },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(DrawingsAttributesEntity),
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found!',
  })
  @ADMIN_AUTH()
  @Patch('/:drawingId/attributes/:attributeId')
  async updateAttribute(
    @Param('drawingId') drawingId: string,
    @Param('attributeId') attributeId: string,
    @Body() dto: DrawingsAttributesEntity,
  ) {
    return this.drawingsService.updateAttribute(drawingId, attributeId, dto);
  }

  @ApiOperation({ summary: 'Delete an attribute for a drawing.' })
  @ApiOkResponse({
    description: 'Drawings attribute deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found!',
  })
  @ADMIN_AUTH()
  @Delete('/:drawingId/attributes/:attributeId')
  async deleteAttribute(
    @Param('drawingId') drawingId: string,
    @Param('attributeId') attributeId: string,
  ) {
    return this.drawingsService.deleteAttribute(drawingId, attributeId);
  }

  @ApiOperation({ summary: 'Download a drawing.' })
  @ApiOkResponse({
    type: String,
    description: 'Returns link for downloading drawing.',
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawing not found!',
  })
  @CLIENT_AUTH()
  @Get('/:drawingId/download')
  async downloadDrawing(
    @Param('drawingId') drawingId: string,
    @Query() drawingLng: DownloadDrawingsQuery,
    @Res() res,
  ) {
    const drawing = await this.drawingsService.downloadDrawing(
      drawingId,
      drawingLng,
    );

    res.send({ url: drawing.filePath });
  }
}
