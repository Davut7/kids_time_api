import { Test, TestingModule } from '@nestjs/testing';
import { PropertyController } from '../books.controller';
import { PropertyService } from '../books.service';

describe('PropertyController', () => {
  let controller: PropertyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyController],
      providers: [PropertyService],
    }).compile();

    controller = module.get<PropertyController>(PropertyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
