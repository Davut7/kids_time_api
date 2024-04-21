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
import { BooksEntity } from './entities/books.entity';
import { BooksAttributesEntity } from './entities/booksAttributes.entity';
import { CreateBookDto } from './dto/createBook.dto';
import { GetBooksQuery } from './dto/getBooks.dto';
import { UpdateBookDto } from './dto/updateBook.dto';
import { CreateBookAttributeDto } from './dto/createBookAttribute.dto';
import { UpdateBookAttributeDto } from './dto/updateBookAttribute.dto';
import { UploadBookDto } from './dto/uploadBook.dto';
import { CategoryEntity } from 'src/category/entities/category.entity';
import { DownloadBookQuery } from './dto/downloadBook.query';
import { UserTokenDto } from 'src/client/token/dto/token.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(BooksEntity)
    private booksRepository: Repository<BooksEntity>,
    @InjectRepository(BooksAttributesEntity)
    private booksAttributesRepository: Repository<BooksAttributesEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    private mediaService: MediaService,
    private dataSource: DataSource,
  ) {}

  async createBooks(dto: CreateBookDto, categoryId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    const book = this.booksRepository.create({
      ...dto,
      categoryId: categoryId,
    });

    await this.booksRepository.save(book);

    return {
      message: 'Book created successfully',
      book: book,
    };
  }

  async getBooks(query: GetBooksQuery) {
    const { page = 1, take = 10, q = '', lng = LanguageEnum.en } = query;
    const booksQuery = this.booksRepository
      .createQueryBuilder('books')
      .leftJoinAndSelect('books.medias', 'medias')
      .leftJoinAndSelect('books.attributes', 'attributes');
    if (q) {
      booksQuery.where(
        'attributes.title ILIKE :q AND attributes.language = :lng',
        {
          q: `%${q}%`,
          lng,
        },
      );
    }
    const [books, count] = await booksQuery
      .skip((page - 1) * take)
      .take(10)
      .getManyAndCount();

    return {
      books: books,
      booksCount: count,
    };
  }

  async getOneBook(bookId: string, currentUser?: UserTokenDto) {
    const book = await this.booksRepository
      .createQueryBuilder('books')
      .leftJoinAndSelect('books.medias', 'medias')
      .leftJoinAndSelect('books.attributes', 'attributes')
      .where('books.id = :bookId', { bookId })
      .getOne();
    if (book.requiredLevel > currentUser?.level)
      throw new ForbiddenException('Your level is lower than required');
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async updateBooks(bookId: string, dto: UpdateBookDto) {
    const book = await this.getOneBook(bookId);

    Object.assign(book, dto);

    await this.booksRepository.save(book);

    return {
      message: 'Book updated successfully',
      book: book,
    };
  }

  async deleteBooks(bookId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    const book = await this.getOneBook(bookId);
    let bookMediaIds: string[] = [];
    for (const media of book.medias) {
      bookMediaIds.push(media.id);
    }
    try {
      await this.booksRepository.delete(book.id);
      return {
        message: 'Book deleted successfully',
      };
    } catch (error) {
      queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await this.mediaService.deleteMedias(bookMediaIds, queryRunner);
      queryRunner.release();
    }
  }

  async uploadMedia(
    file: ITransformedFile,
    bookId: string,
    dto: UploadBookDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    const book = await this.getOneBook(bookId);

    let uploadedFileId: string;

    for (const media of book.medias) {
      if (media.mediaLng === dto.lng)
        throw new ConflictException('You already have a book in this language');
    }
    try {
      console.log(dto.lng);
      const mediaId = await this.mediaService.createFileMedia(
        file,
        bookId,
        queryRunner,
        'bookId',
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

  async deleteMedia(bookId: string, mediaId: string) {
    await this.getOneBook(bookId);
    await this.mediaService.getOneMedia(mediaId);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    await queryRunner.connect();
    try {
      await this.mediaService.deleteOneMedia(mediaId, queryRunner);
      await queryRunner.commitTransaction();
      return {
        message: 'Book deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async createAttribute(dto: CreateBookAttributeDto, bookId: string) {
    const candidate = await this.isAttributeUnique(dto.language, bookId);
    if (candidate)
      throw new ConflictException(
        'Books attribute with this language already exists',
      );
    const attribute = this.booksAttributesRepository.create({
      ...dto,
      bookId: bookId,
    });
    await this.booksAttributesRepository.save(attribute);
    return {
      message: 'Book attribute with this language',
      attribute,
    };
  }

  async updateAttribute(
    bookId: string,
    attributeId: string,
    dto: UpdateBookAttributeDto,
  ) {
    const attribute = await this.getOneAttribute(bookId, attributeId);

    Object.assign(attribute, dto);

    await this.booksAttributesRepository.save(attribute);

    return {
      message: 'Attribute updated successfully',
      attribute,
    };
  }

  async deleteAttribute(bookId: string, attributeId: string) {
    const attribute = await this.getOneAttribute(bookId, attributeId);

    await this.booksAttributesRepository.delete(attribute.id);

    return {
      message: 'Attribute deleted  successfully',
    };
  }

  async getOneAttribute(bookId: string, attributeId: string) {
    const attribute = await this.booksAttributesRepository.findOne({
      where: { id: attributeId, bookId: bookId },
    });
    if (!attribute) throw new NotFoundException('Attribute not found');
    return attribute;
  }

  private async isAttributeUnique(language: LanguageEnum, bookId: string) {
    const attribute = await this.booksAttributesRepository
      .createQueryBuilder('attributes')
      .where(
        'attributes.language = :language AND attributes.bookId = :bookId',
        { language: language, bookId },
      )
      .getOne();

    return attribute;
  }

  async downloadBook(bookId: string, bookLanguage: DownloadBookQuery) {
    await this.getOneBook(bookId);

    const media = await this.mediaService.getMediaByLng(
      'bookId',
      bookId,
      bookLanguage.lng,
    );
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }
}
