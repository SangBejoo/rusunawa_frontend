import React from 'react';
import {
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  HStack,
  Icon,
  useBreakpointValue
} from '@chakra-ui/react';
import {
  FaEye,
  FaCreditCard,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimesCircle,
  FaDownload,
  FaReceipt,
  FaEllipsisV,
  FaEdit,
  FaStar
} from 'react-icons/fa';

const BookingActionButtons = ({ 
  booking, 
  onAction, 
  size = 'sm',
  variant = 'outline',
  showLabels = true 
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  if (!booking || !booking.nextActions) {
    return (
      <Button
        size={size}
        variant={variant}
        leftIcon={<FaEye />}
        onClick={() => onAction(booking?.bookingId, 'view')}
      >
        {showLabels ? 'View Details' : ''}
      </Button>
    );
  }
  
  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'payment': return FaCreditCard;
      case 'checkin': return FaSignInAlt;
      case 'checkout': return FaSignOutAlt;
      case 'cancel': return FaTimesCircle;
      case 'receipt': return FaReceipt;
      case 'download_receipt': return FaDownload;
      case 'review': return FaStar;
      case 'edit': return FaEdit;
      default: return FaEye;
    }
  };
  
  const getActionColor = (actionType, priority) => {
    if (priority === 'high') {
      switch (actionType) {
        case 'payment': return 'green';
        case 'checkin': return 'blue';
        case 'checkout': return 'orange';
        default: return 'brand';
      }
    }
    
    switch (actionType) {
      case 'cancel': return 'red';
      case 'payment': return 'green';
      case 'checkin': return 'blue';
      case 'checkout': return 'orange';
      default: return 'gray';
    }
  };
  
  // Separate high priority actions from others
  const highPriorityActions = booking.nextActions.filter(action => action.priority === 'high');
  const otherActions = booking.nextActions.filter(action => action.priority !== 'high');
  
  // Always show view action
  const viewAction = {
    type: 'view',
    label: 'View Details',
    action: 'view',
    priority: 'medium'
  };
  
  // For mobile, show only the most important action + menu
  if (isMobile) {
    const primaryAction = highPriorityActions[0] || otherActions[0] || viewAction;
    const menuActions = [
      ...highPriorityActions.slice(1),
      ...otherActions,
      viewAction
    ].filter(action => action.action !== primaryAction.action);
    
    return (
      <HStack spacing={2} width="full">
        <Button
          size={size}
          colorScheme={getActionColor(primaryAction.type, primaryAction.priority)}
          variant={primaryAction.priority === 'high' ? 'solid' : variant}
          leftIcon={<Icon as={getActionIcon(primaryAction.type)} />}
          onClick={() => onAction(booking.bookingId, primaryAction.action)}
          flex={1}
        >
          {primaryAction.label}
        </Button>
        
        {menuActions.length > 0 && (
          <Menu>
            <MenuButton
              as={Button}
              size={size}
              variant="outline"
              px={2}
            >
              <Icon as={FaEllipsisV} />
            </MenuButton>
            <MenuList>
              {menuActions.map((action, index) => (
                <MenuItem
                  key={index}
                  icon={<Icon as={getActionIcon(action.type)} />}
                  onClick={() => onAction(booking.bookingId, action.action)}
                >
                  {action.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        )}
      </HStack>
    );
  }
  
  // For desktop, show multiple buttons based on available space
  const allActions = [...highPriorityActions, ...otherActions, viewAction];
  const uniqueActions = allActions.filter((action, index, self) => 
    index === self.findIndex(a => a.action === action.action)
  );
  
  // Show first 2-3 actions as buttons, rest in menu
  const visibleActions = uniqueActions.slice(0, 3);
  const menuActions = uniqueActions.slice(3);
  
  return (
    <HStack spacing={2} width="full">
      <ButtonGroup size={size} variant={variant} spacing={2} flex={1}>
        {visibleActions.map((action, index) => (
          <Button
            key={index}
            colorScheme={getActionColor(action.type, action.priority)}
            variant={action.priority === 'high' ? 'solid' : variant}
            leftIcon={showLabels ? <Icon as={getActionIcon(action.type)} /> : undefined}
            onClick={() => onAction(booking.bookingId, action.action)}
            size={size}
            flex={visibleActions.length <= 2 ? 1 : undefined}
          >
            {showLabels ? action.label : <Icon as={getActionIcon(action.type)} />}
          </Button>
        ))}
      </ButtonGroup>
      
      {menuActions.length > 0 && (
        <Menu>
          <MenuButton
            as={Button}
            size={size}
            variant="outline"
            px={2}
          >
            <Icon as={FaEllipsisV} />
          </MenuButton>
          <MenuList>
            {menuActions.map((action, index) => (
              <MenuItem
                key={index}
                icon={<Icon as={getActionIcon(action.type)} />}
                onClick={() => onAction(booking.bookingId, action.action)}
                color={action.type === 'cancel' ? 'red.500' : undefined}
              >
                {action.label}
              </MenuItem>
            ))}
            <MenuDivider />
            <MenuItem
              icon={<Icon as={FaEye} />}
              onClick={() => onAction(booking.bookingId, 'view')}
            >
              View Full Details
            </MenuItem>
          </MenuList>
        </Menu>
      )}
    </HStack>
  );
};

export default BookingActionButtons;
