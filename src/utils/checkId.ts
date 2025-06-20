import { Response } from 'express';
import { throwError } from './error';
import mongoose from 'mongoose';

interface CheckId {
  id: string;
  res: Response;
}

export const checkId = ({id: id, res}:CheckId): boolean => {
    if(!id){ 
        throwError({ message: "Id is required", res, status: 400}); 
        return false;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throwError({ message: "Invalid user ID format", res, status: 400});
        return false;
    }

    return true;
};
