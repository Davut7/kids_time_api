import { Test, TestingModule } from '@nestjs/testing';
import { PropertyService } from '../books.service';

describe('PropertyService', () => {
  let service: PropertyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyService],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
