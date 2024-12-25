import { Response } from 'express';
import { throwError } from './error';
import mongoose from 'mongoose';

interface CheckId {
  id: string;
  res: Response;
}

export const checkId = ({id: id, res}:CheckId): void => {
    if(!id){
        return throwError({ message: "Id is required", res, status: 400}); 
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return throwError({ message: "Invalid user ID format", res, status: 400});
    }
};
