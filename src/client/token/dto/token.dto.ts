import { UserEntity } from '../../user/entities/user.entity';


export class UserTokenDto {
  id: string;
  nickName: string;
  email: string;
  level: number;
  isVerified: boolean;
  expRequiredForNextLevel: number
  currentExp:number

  constructor(entity: UserEntity) {
    this.id = entity.id;
    this.nickName = entity.nickName;
    this.email = entity.email;
    this.level = entity.level;
    this.isVerified = entity.isVerified
    this.expRequiredForNextLevel = entity.expRequiredForNextLevel
    this.currentExp = entity.currentExp
  }
}
