/**
 * Encapsulates parsing of version sting into split collection of numbers
 * to reduce and simplify code across tests
 */
class PmmVersion {
  version: string;
  public major: number;
  public minor: number;
  public patch: number;

  public constructor(versionString: string) {
    if (!versionString.includes('.') || versionString.split('.').length !== 3 ) {
      throw new Error('Provided argument is not a PMM version string');
    }
    const [versionMajor, versionMinor, versionPatch] = versionString.split('.');
    this.version = versionString;
    this.major = parseInt(versionMajor);
    this.minor = parseInt(versionMinor);
    this.patch = parseInt(versionPatch);
  }

  public toString = () : string => {
    return this.version;
  }
}
