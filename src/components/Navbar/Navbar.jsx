import React, { useState, useEffect, memo } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  MenuItem,
  Menu,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItemText,
  ListItemIcon
} from "@mui/material";
import { NavLink } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import Logo from "../../images/logo.png";
import PersonIcon from "@mui/icons-material/Person";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { useAuth } from "../../context/AuthContext";
import { useCounters } from "../../context/CountersContext"; 
import axiosInstance from "../../services/axiosInstance";
import menuConfig from "../../config/menuConfig.json";
import NotificationCounter from "../NotificationCounter/NotificationCounter";
import RepliesAvailableCounter from "../RepliesAvailableCounter/RepliesAvailableCounter";

const Navbar = ({ navigate }) => {
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [openLogoutFullDialog, setOpenLogoutFullDialog] = useState(false);
  const { isLoggedIn, userInfo, logout, logoutFull } = useAuth();
  const [systemInfo, setSystemInfo] = useState({});
  const [submenuOpen, setSubmenuOpen] = useState({}); // State to handle submenu open/close for each menu
  
  // Use counters from the CountersContext
  const { notificationCount, clientReplyCount } = useCounters();

  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchAboutInfo = async () => {
      try {
        const response = await axiosInstance.get("/about/system_info");
        setSystemInfo({
          app_version: response.data.app_version,
          latest_version: response.data.latest_version,
          environment: response.data.environment,
        });
      } catch (error) {
        console.error("Error fetching system information:", error);
      }
    };
    fetchAboutInfo();
  }, []);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogoutClick = () => {
    handleCloseUserMenu();
    setOpenLogoutDialog(true);
  };

  const handleLogoutFullClick = () => {
    handleCloseUserMenu();
    setOpenLogoutFullDialog(true);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCancelLogout = () => {
    setOpenLogoutDialog(false);
  };

  const handleCancelLogoutFull = () => {
    setOpenLogoutFullDialog(false);
  };

  const handleLogout = () => {
    setOpenLogoutDialog(false);
    logout().then(() => {
      navigate("/logout/success");
    });
  };

  const handleLogoutFull = () => {
    setOpenLogoutFullDialog(false);
    logoutFull();
  };

  const toggleSubmenu = (label) => {
    setSubmenuOpen((prevSubmenuOpen) => ({
      ...prevSubmenuOpen,
      [label]: !prevSubmenuOpen[label],
    }));
  };

  const renderMenuItems = (items) => {
    return items.map((item) => {
      if (item.submenu) {
        return (
          <div key={item.label}>
            <MenuItem onClick={() => toggleSubmenu(item.label)}>
              <ListItemText primary={item.label} />
              <ListItemIcon>
                {submenuOpen[item.label] ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
              </ListItemIcon>
            </MenuItem>
            {submenuOpen[item.label] && item.submenu.map((subItem) => (
              <MenuItem
                key={subItem.label}
                onClick={handleClose}
                component={NavLink}
                to={subItem.path}
                sx={{ pl: 4 }} // Add padding to indent submenus
              >
                {subItem.label}
              </MenuItem>
            ))}
          </div>
        );
      }
      return (
        <MenuItem key={item.label} onClick={handleClose} component={NavLink} to={item.path}>
          {item.label}
        </MenuItem>
      );
    });
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          component={NavLink}
          to="/"
          className="app-logo"
        >
          <img
            src={Logo}
            alt="Logo"
            style={{ width: "50px", height: "50px" }}
          />
        </IconButton>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <Typography variant="h6" sx={{ lineHeight: "normal" }}>
            mcrm
          </Typography>
          <Box sx={{ ml: 2, display: "flex", flexDirection: "row" }}>
            <Typography variant="caption" sx={{ marginRight: 1 }}>
              {systemInfo.app_version && (<>v{systemInfo.app_version}</>)}
            </Typography>
            <Typography variant="caption">
              {systemInfo.environment && systemInfo.environment !== "production" && (
                <span>({systemInfo.environment})</span>
              )}
              {systemInfo.latest_version && !systemInfo.latest_version && (
                <span style={{ color: "lightpink" }}>
                  {" "}
                  - New Version Available!
                </span>
              )}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flexGrow: 0 }}>
          {isLoggedIn ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <RepliesAvailableCounter counter={clientReplyCount} />
              <NotificationCounter counter={notificationCount} />
              <Button
                onClick={handleOpenUserMenu}
                color="inherit"
                className="sign-in"
              >
                {userInfo && (
                  <Typography
                    variant="body2"
                    sx={{
                      display: "inline",
                      verticalAlign: "middle",
                      marginRight: 2,
                    }}
                  >
                    {userInfo.displayName}
                  </Typography>
                )}
                <PersonIcon />
              </Button>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem disabled></MenuItem>
                <MenuItem disabled>
                  <Typography textAlign="center">{userInfo?.mail}</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogoutClick}>
                  <Typography textAlign="center">Sign out</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogoutFullClick}>
                  <Typography textAlign="center">
                    Sign Out and Switch Account
                  </Typography>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button
              color="inherit"
              component={NavLink}
              to="/login"
              className="sign-in"
            >
              Login
            </Button>
          )}
        </Box>
        <Box>
          <IconButton
            id="campaigns-menu-button"
            aria-controls="campaigns-menu"
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="campaigns-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "campaigns-menu-button",
            }}
          >
            {renderMenuItems(menuConfig)}
          </Menu>
        </Box>
        <Dialog
          open={openLogoutDialog}
          onClose={handleCancelLogout}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Confirm Logout"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to log out?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelLogout}>Cancel</Button>
            <Button onClick={handleLogout} autoFocus>
              Sign Out
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openLogoutFullDialog}
          onClose={handleCancelLogoutFull}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Confirm Logout"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Signing out fully will require you to log in again. This allows
              you to switch accounts if needed. Do you want to proceed?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelLogoutFull}>Cancel</Button>
            <Button onClick={handleLogoutFull} autoFocus>
              Sign Out and Switch Account
            </Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
};

// Memoize the Navbar to avoid unnecessary re-renders
export default memo(Navbar);