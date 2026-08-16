export const MAX_BRANCH_COMPARE = 15;
export const BIG_TREE_THRESHOLD = 2000;
export const REL_PATH_REGEX = /(?:\.\.?\/)(?:[a-zA-Z0-9_\-\.]+\/?)+(?:\.[a-zA-Z0-9]+)?/g;
export const MD_LINK_REGEX = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const BT = String.fromCharCode(96);
export const CODE_SPAN_REGEX = new RegExp(BT + '([^' + BT + '\\n]+)' + BT, 'g');