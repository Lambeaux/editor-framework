var Utils = {};

/**
 * @method padLeft
 * @param {string} text
 * @param {number} width
 * @param {string} ch - the character used to pad
 * @return {string}
 */
Utils.padLeft = function ( text, width, ch ) {
    text = text.toString();
    width -= text.length;
    if ( width > 0 ) {
        return new Array( width + 1 ).join(ch) + text;
    }
    return text;
};

Utils.formatFrame = function ( frame, frameRate ) {
    var decimals = Math.floor(Math.log10(frameRate))+1;
    var text = '';
    if ( frame < 0 ) {
        text = '-';
        frame = -frame;
    }
    return text +
        (frame/frameRate).toFixed(0) + ':' +
        Utils.padLeft(frame % frameRate, decimals, '0');
};

module.exports = Utils;
