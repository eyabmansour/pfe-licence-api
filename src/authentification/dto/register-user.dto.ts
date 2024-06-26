import { IsString, Length } from "class-validator";

export class RegisterUsersDto{
    @IsString()
    @Length(5,10)
    username:string

    @IsString()
    @Length(6,10)
    password:string
    
    @IsString()
    @Length(7,14)
    email:string
}