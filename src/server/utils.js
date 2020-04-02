

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...sources){
    //Combining two object {1:{A:{}}, 2:{A:{}}}, {1: {B:{}}, 2:{B:{}}} => {1:{A:{}, B:{}}, 2:{A:{}}, B:{}}
    //iterate one object and add to new, then iterate next object and add to new
    //to ensure we take duplicates and unique we loop each object

    //to make it quicker: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
    if (!sources.length) return target;
    const source = sources.shift();
  
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  
    return mergeDeep(target, ...sources);
}

module.exports = {
    mergeDeep
}