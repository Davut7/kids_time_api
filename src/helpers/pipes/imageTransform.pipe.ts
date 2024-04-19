import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  PipeTransform,
} from '@nestjs/common';
import { MinioService } from '../../minio/minio.service';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { ITransformedFile } from '../common/interfaces/fileTransform.interface';

@Injectable()
export class ImageTransformer implements PipeTransform<Express.Multer.File> {
  constructor(private readonly minioService: MinioService) {}

  async transform(file: Express.Multer.File): Promise<ITransformedFile> {
    if (!file) throw new BadRequestException('Image not provided');
    let transformedFile: ITransformedFile;
    try {
      const uploadStream = createReadStream(file.path);

      await this.minioService.uploadFileStream(
        file.filename,
        uploadStream,
        file.mimetype,
      );

      transformedFile = {
        fileName: file.filename,
        originalName: file.originalname,
        filePath: await this.minioService.getFileUrl(file.filename),
        mimeType: file.mimetype,
        size: file.size.toString(),
      };
      await unlink(file.path);
    } catch (err) {
      console.error(`Error processing file ${file.originalname}:`, err);
      await unlink(file.path);
      throw new InternalServerErrorException(
        'Failed to process some files. Please check server logs for details.',
      );
    }

    return transformedFile;
  }
}
