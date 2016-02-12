var util = {};
module.exports = util;


util.unsortedCompareArray = function(array1, array2) {
    return array1.sort().join(',')=== array2.sort().join(',');
};
