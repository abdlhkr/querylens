package kara.saas.exception;

import kara.saas.common.StatusType;

/**
 * Exception for business logic violations.
 */
public class BusinessException extends BaseException {

    public BusinessException(String message) {
        super(message, StatusType.ERROR, "BUSINESS_ERROR");
    }

    public BusinessException(String message, String errorCode) {
        super(message, StatusType.ERROR, errorCode);
    }

    public BusinessException(String message, StatusType statusType) {
        super(message, statusType, "BUSINESS_ERROR");
    }

    public BusinessException(String message, StatusType statusType, String errorCode) {
        super(message, statusType, errorCode);
    }
}
