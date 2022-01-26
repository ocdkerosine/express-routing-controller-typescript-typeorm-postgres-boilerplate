import IPromise from 'bluebird';
/**
 * @method delay
 * @param {Number} value
 * @returns {Promise<Boolean>} true & false
 * @description pause time
 */
export const delay = async (seconds: number): Promise<boolean> => {
  return new IPromise(resolve => setTimeout(resolve, seconds * 1000));
};
