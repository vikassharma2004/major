export const catchAsyncError = (fn) => {
  return (req, res, next) => {
    console.log("Handler type:", fn.name);
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};