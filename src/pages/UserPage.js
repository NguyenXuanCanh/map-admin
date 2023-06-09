import { Helmet } from 'react-helmet-async';
import { filter } from 'lodash';
import { sentenceCase } from 'change-case';
import { useEffect, useMemo, useState } from 'react';
// @mui
import {
  Card,
  Table,
  Stack,
  Paper,
  Avatar,
  Button,
  Popover,
  Checkbox,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  Container,
  Typography,
  IconButton,
  TableContainer,
  TablePagination,
} from '@mui/material';
import axios from 'axios';

// components
import Label from '../components/label';
import Iconify from '../components/iconify';
import Scrollbar from '../components/scrollbar';
// sections
import { UserListHead, UserListToolbar } from '../sections/@dashboard/user';

import { BASE_URL } from '../config/constant';
import DrawerCustom from '../sections/@dashboard/common/DrawerCustom';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'photo', label: 'Photo', alignRight: false },
  { id: 'username', label: 'Username', alignRight: false },
  { id: 'displayName', label: 'Display Name', alignRight: false },
  //   { id: 'photoURL', label: 'Photo', alignRight: false },
  { id: 'email', label: 'Email', alignRight: false },
  { id: 'phoneNumber', label: 'Phone Number', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },

  { id: 'action', label: 'Action', alignRight: false },
];

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(array, (_user) => _user.username.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis.map((el) => el[0]);
}

export default function UserPage() {
  const [open, setOpen] = useState(null);

  const [page, setPage] = useState(0);

  const [order, setOrder] = useState('asc');

  const [selected, setSelected] = useState([]);

  const [orderBy, setOrderBy] = useState('Id');

  const [filterName, setFilterName] = useState('');

  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [userList, setUserList] = useState([]);

  const [selectedUser, setSelectedUser] = useState();

  const [isOpenDrawer, setOpenDrawer] = useState();

  const [menuKey, setMenuKey] = useState();

  const toggleDrawer = (key) => {
    setOpen(null);
    if (key) {
      setMenuKey(key);
      setOpenDrawer(true);
    } else {
      setOpenDrawer(false);
    }
  };

  const handleOpenMenu = (event, item) => {
    setSelectedUser(item);
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setSelectedUser(null);
    setOpen(null);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = userList.map((n) => n.Id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, Id) => {
    const selectedIndex = selected.indexOf(Id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, Id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - userList.length) : 0;

  const filteredUsers = applySortFilter(userList, getComparator(order, orderBy), filterName);

  const isNotFound = !filteredUsers.length && !!filterName;

  const reload = () => {
    (async () => {
      async function fetchData() {
        const response = await axios.get(`${BASE_URL}/admin/users`);
        return response;
      }
      fetchData()
        .then((response) => {
          setUserList(response?.data?.data);
          console.log(response);
        })
        .catch((error) => {
          console.log(error);
        });
    })();
  };

  const onSubmit = (value) => {
    if (menuKey === 'editUser') {
      (async () => {
        async function fetchData() {
          const response = await axios.post(`${BASE_URL}/user_update`, value);
          return response;
        }
        fetchData()
          .then((response) => {
            // console.log(response?.data?.data);
            setOpenDrawer(false);
            reload();
          })
          .catch((error) => {
            console.log(error);
          });
      })();
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <>
      <Helmet>
        <title> User </title>
      </Helmet>

      <Container style={{ minWidth: '100%' }}>
        <Stack direction="row" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            User
          </Typography>
          <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />}>
            New User
          </Button>
        </Stack>

        <Card>
          <UserListToolbar numSelected={selected.length} filterName={filterName} onFilterName={handleFilterByName} />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <UserListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={userList.length}
                  numSelected={selected.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    // { id: 'username', label: 'Username', alignRight: false },
                    // { id: 'displayName', label: 'Display Name', alignRight: false },
                    // { id: 'photoURL', label: 'Photo', alignRight: false },
                    // { id: 'email', label: 'Email', alignRight: false },
                    // { id: 'phoneNumber', label: 'Phone Number', alignRight: false },
                    // { id: 'action', label: 'Action', alignRight: false },
                    const { Id, username, displayName, photoURL, email, phoneNumber, status } = row;
                    const selectedUser = selected.indexOf(Id) !== -1;

                    return (
                      <TableRow hover key={Id} tabIndex={-1} role="checkbox" selected={selectedUser}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedUser} onChange={(event) => handleClick(event, Id)} />
                        </TableCell>

                        <TableCell component="th" scope="row" padding="none">
                          <Stack direction="row" spacing={2} paddingLeft={2}>
                            <Avatar alt={displayName} src={photoURL} />
                            {/* <Typography variant="subtitle2" noWrap>
                              {displayName}
                            </Typography> */}
                          </Stack>
                        </TableCell>

                        <TableCell>{username}</TableCell>

                        <TableCell>{displayName}</TableCell>

                        <TableCell>{email}</TableCell>

                        <TableCell>{phoneNumber}</TableCell>
                        <TableCell align="left">
                          <Label
                            color={
                              status === 'working'
                                ? 'success'
                                : status === 'not_working'
                                ? 'warning'
                                : status === 'deleted'
                                ? 'error'
                                : 'error'
                            }
                          >
                            {sentenceCase(status)}
                          </Label>
                        </TableCell>
                        <TableCell>
                          <IconButton size="large" color="inherit" onClick={(event) => handleOpenMenu(event, row)}>
                            <Iconify icon={'eva:more-vertical-fill'} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>

                {isNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <Paper
                          sx={{
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h6" paragraph>
                            Not found
                          </Typography>

                          <Typography variant="body2">
                            No results found for &nbsp;
                            <strong>&quot;{filterName}&quot;</strong>.
                            <br /> Try checking for typos or using complete words.
                          </Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={userList.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 1,
            width: 180,
            '& .MuiMenuItem-root': {
              px: 1,
              typography: 'body2',
              borderRadius: 0.75,
            },
          },
        }}
      >
        <MenuItem onClick={() => toggleDrawer('assignPackages')}>
          <Iconify icon={'eva:car-fill'} sx={{ mr: 2 }} />
          Assign packages
        </MenuItem>

        <MenuItem onClick={() => toggleDrawer('editUser')}>
          <Iconify icon={'eva:edit-fill'} sx={{ mr: 2 }} />
          Edit
        </MenuItem>

        <MenuItem sx={{ color: 'error.main' }}>
          <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>

      <DrawerCustom
        menu={menuKey}
        open={isOpenDrawer}
        value={selectedUser}
        onClose={() => toggleDrawer()}
        onSubmit={onSubmit}
      />
    </>
  );
}
