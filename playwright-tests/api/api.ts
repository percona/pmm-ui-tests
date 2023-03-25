import {serverAPIv1} from "@api/serverApiV1";
import {settingsAPIv1} from "@api/settingsApiV1";

/**
 * User facing api collection. Accessible on Frontend via /swagger path.
 * API version intentionally included into the API groups to have
 * obvious which API and which version is used.
 */
export const api = {
  settingsV1: settingsAPIv1,
  serverV1: serverAPIv1,
}
