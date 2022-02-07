const merkle = require("merkle");
const {
  isValidTimestamp,
  createHash,
  hashMatchesDifficulty,
} = require("./chainedBlock");
function isValidBlockStructure(block) {
  return (
    typeof block.header.version === "string" &&
    typeof block.header.index === "number" &&
    typeof block.header.previousHash === "string" &&
    typeof block.header.timestamp === "number" &&
    typeof block.header.merkleRoot === "string" &&
    typeof block.header.difficulty === "number" &&
    typeof block.header.nonce === "number" &&
    typeof block.body === "object"
  );
}
function isValidNewBlock(newBlock, previousBlock) {
  if (isValidBlockStructure(newBlock) === false) {
    console.log("유효하지 않은 블록구조입니다.");
    return false;
  } else if (newBlock.header.index !== previousBlock.header.index + 1) {
    console.log("인덱스가 유효하지 않습니다.");
    return false;
  } else if (createHash(previousBlock) !== newBlock.header.previousHash) {
    console.log("해시값이 유효하지 않습니다.");
    return false;
  } else if (
    (newBlock.body.length === 0 &&
      "0".repeat(64) !== newBlock.header.merkleRoot) ||
    (newBlock.body.length !== 0 &&
      merkle("sha256").sync(newBlock.body).root() !==
        newBlock.header.merkleRoot)
  ) {
    console.log("머클루트가 유효하지 않습니다.");
    return false;
  } else if (!isValidTimestamp(newBlock, previousBlock)) {
    console.log("타임스탬프가 유효하지 않습니다.");
    return false;
  } else if (
    !hashMatchesDifficulty(createHash(newBlock), newBlock.header.difficulty)
  ) {
    console.log("난이도가 유효하지 않습니다.");
    return false;
  }
  console.log("유효성 검사 결과 이상 없음.");
  return true;
}

module.exports = { isValidNewBlock };
