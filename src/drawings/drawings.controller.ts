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
  UseGuards,
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
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { ITransformedFile } from 'src/helpers/common/interfaces/fileTransform.interface';
import { AdminAuthGuard } from 'src/helpers/guards/adminAuth.guard';
import { DrawingsService } from './drawings.service';
import { DrawingsEntity } from './entities/drawings.entity';
import { CreateDrawingDto } from './dto/createDrawing.dto';
import { GetDrawingsQuery } from './dto/getDrawings.dto';
import { UpdateDrawingsDto } from './dto/updateDrawings.dto';
import { PdfTransformer } from 'src/helpers/pipes/booksTransform.pipe';
import { UploadDrawingsDto } from './dto/uploadDrawings.dto';
import { DrawingsAttributesEntity } from './entities/drawingsAttributes.entity';
import { CreateDrawingsAttributeDto } from './dto/createDrawingAttribute.dto';
import { DownloadDrawingsQuery } from './dto/downloadDrawing.query';
import { UserAuthGuard } from 'src/helpers/guards/userAuth.guard';
import { CurrentUser } from 'src/helpers/common/decorators/currentUser.decorator';
import { UserTokenDto } from 'src/client/token/dto/token.dto';

@ApiTags('drawings')
@ApiBearerAuth()
@Controller('/drawings')
export class DrawingsController {
  constructor(private readonly drawingsService: DrawingsService) {}

  @ApiCreatedResponse({
    description: 'Drawing created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Drawing created successfully' },
        drawings: { $ref: getSchemaPath(DrawingsEntity) },
      },
    },
  })
  @ApiConflictResponse({
    type: ConflictException,
    description: 'Drawing with this title already exists',
  })
  @UseGuards(AdminAuthGuard)
  @Post(':categoryId')
  async createDrawing(
    @Body() dto: CreateDrawingDto,
    @Param('categoryId') categoryId: string,
  ) {
    return this.drawingsService.createDrawing(dto, categoryId);
  }

  @ApiOkResponse({
    description: 'Drawings returned successfully',
    schema: {
      type: 'object',
      properties: {
        properties: { items: { $ref: getSchemaPath(DrawingsEntity) } },
        propertiesCount: { type: 'number' },
      },
    },
  })
  @Get()
  async getDrawings(@Query() query: GetDrawingsQuery) {
    return this.drawingsService.getDrawings(query);
  }

  @ApiOkResponse({
    description: 'Single drawing retrieved successfully',
    type: DrawingsEntity,
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawing not found',
  })
  @ApiParam({ name: 'drawingId', description: 'drawing id' })
  @UseGuards(UserAuthGuard)
  @Get('/:drawingId')
  async getOneDrawing(
    @Param('drawingId') drawingsId: string,
    @CurrentUser() currentUser: UserTokenDto,
  ) {
    return this.drawingsService.getOneDrawing(drawingsId, currentUser);
  }

  @ApiOkResponse({
    description: 'Drawing updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Drawing updated successfully' },
        drawings: { $ref: getSchemaPath(DrawingsEntity) },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawing not found',
  })
  @ApiParam({ name: 'drawingId', description: 'drawing id' })
  @UseGuards(AdminAuthGuard)
  @Patch('/:drawingId')
  async updateDrawings(
    @Param('drawingId') drawingId: string,
    @Body() dto: UpdateDrawingsDto,
  ) {
    return this.drawingsService.updateDrawing(drawingId, dto);
  }

  @ApiOkResponse({
    description: 'Drawing deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Drawing deleted successfully' },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawing not found',
  })
  @ApiParam({ name: 'drawingId', description: 'drawing id' })
  @UseGuards(AdminAuthGuard)
  @Delete('/:drawingId')
  async deleteDrawings(@Param('drawingId') drawingId: string) {
    return this.drawingsService.deleteDrawing(drawingId);
  }

  @ApiOkResponse({ description: 'Drawing uploaded successfully' })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawings not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading drawing',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AdminAuthGuard)
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

  @ApiOkResponse({
    description: 'Drawings media uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Drawings media deleted successfully',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawings not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error while uploading drawings',
    type: InternalServerErrorException,
  })
  @UseGuards(AdminAuthGuard)
  @Delete('/:drawingId/media/:mediaId')
  async deleteDrawingsMedia(
    @Param('drawingId', ParseUUIDPipe) drawingId: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    return this.drawingsService.deleteMedia(drawingId, mediaId);
  }

  @ApiCreatedResponse({
    description: 'Drawings attribute created successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Drawings attribute created successfully',
        },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(DrawingsAttributesEntity),
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Drawings attribute with this language already exists',
  })
  @UseGuards(AdminAuthGuard)
  @Post('/attributes/:drawingId')
  async createAttribute(
    @Body() dto: CreateDrawingsAttributeDto,
    @Param('drawingId') drawingId: string,
  ) {
    return this.drawingsService.createAttribute(dto, drawingId);
  }

  @ApiOkResponse({
    description: 'Drawings attribute updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Attribute updated successfully' },
        attribute: {
          type: 'object',
          $ref: getSchemaPath(DrawingsAttributesEntity),
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found',
  })
  @UseGuards(AdminAuthGuard)
  @Patch('/:drawingId/attributes/:attributeId')
  async updateAttribute(
    @Param('drawingId') drawingId: string,
    @Param('attributeId') attributeId: string,
    @Body() dto: DrawingsAttributesEntity,
  ) {
    return this.drawingsService.updateAttribute(drawingId, attributeId, dto);
  }

  @ApiOkResponse({
    description: 'Drawings attribute deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Attribute not found',
  })
  @UseGuards(AdminAuthGuard)
  @Delete('/:drawingId/attributes/:attributeId')
  async deleteAttribute(
    @Param('drawingId') drawingId: string,
    @Param('attributeId') attributeId: string,
  ) {
    return this.drawingsService.deleteAttribute(drawingId, attributeId);
  }

  @ApiOkResponse({
    type: String,
    description: 'Returns link for downloading drawing',
  })
  @ApiNotFoundResponse({
    type: NotFoundException,
    description: 'Drawing not found',
  })
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
