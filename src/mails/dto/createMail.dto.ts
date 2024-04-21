import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateMailDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    name: 'firstName',
    description: 'User first name',
    required: true,
  })
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @ApiProperty({
    name: 'email',
    description: 'User email',
    required: true,
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    name: 'message',
    description: 'User message',
    required: true,
  })
  message: string;
}
