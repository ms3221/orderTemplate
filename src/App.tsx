import React, { MouseEvent, useEffect, useState } from "react";
import logo from "./logo.svg";
import axios from "axios";
import "./App.css";
import { OrderResponse } from "./types/index";
import { DataGrid, GridColDef, GridCellParams } from "@mui/x-data-grid";
import Box from "../node_modules/@mui/material/Box/Box";
import {
  GridValueGetterParams,
  GridValueSetterParams,
} from "../node_modules/@mui/x-data-grid/models/params/gridCellParams.d";
import { Button } from "@mui/material";
import { MuiSnackBar } from "./components/MuiSnackBar";
import { Open } from "./types/muiSnakBar";
import { DataGridPro } from "../node_modules/@mui/x-data-grid-pro/DataGridPro/DataGridPro";

function App() {
  const Status: any = {
    DELIVERING: "배송중",
    DELIVERED: "배송완료",
    RETURNED: "환불",
    CANCELED: "취소",
    PURCHASE_DECIDED: "구매확정",
  };
  const returnStatusObj: any = {
    RETURN_REJECT: "환불 거부",
    RETURN_DONE: "환불 완료",
  };
  const [open, setOpen] = useState<Open>({
    result: "",
    open: false,
    reason: "",
  });
  const [naverLogin, setNaverLogin] = useState<boolean>(false);
  const columns: GridColDef[] = [
    {
      field: "orderName",
      headerName: "수령자 및 상품 정보",
      width: 1000,
      editable: false,
      renderCell: (params) => (
        <>
          <div className="first_tap">
            <div
              style={
                params.row.openmarket === "coupang"
                  ? { color: "tomato", fontWeight: "bold" }
                  : {
                      color: "green",
                      fontWeight: "bold",
                    }
              }
            >
              [{params.row.openmarket}]
            </div>
            <div>
              구매자 정보 : {params.row.orderName} / {params.row.orderMemberTel}
            </div>

            <div>
              수령자 정보 : {params.row.receiverName} /{" "}
              {params.row.receiverPhone}
            </div>

            <div>개인통관번호 : {params.row.pcc}</div>
            <div>{params.row.productName}</div>
            <div>
              {params.row.productOptionContents}
              <span> / 수량: {params.row.orderQuantity}</span>
            </div>
            <div>
              <a
                href={params.row.taobaoUrl}
                target="_blank"
                rel="noreferrer"
                style={{ marginRight: 30 }}
              >
                {" "}
                타오바오 주문 URL
              </a>
              <a href={params.row.productId} target="_blank" rel="noreferrer">
                판매중인 상품
              </a>
            </div>
          </div>
        </>
      ),
    },

    {
      field: "productOrderStatus",
      headerName: "상품상태",
      type: "string",
      width: 300,
      editable: false,
      renderCell: (params) => (
        <>
          <div
            style={
              params.row.productOrderStatus === "CANCELED" ||
              params.row.productOrderStatus === "RETURNED"
                ? { color: "tomato", fontWeight: "bold", fontSize: "40px" }
                : {
                    color: "green",
                    fontWeight: "bold",
                  }
            }
          >
            {Status[params.row.productOrderStatus] ||
              params.row.productOrderStatus}
          </div>
          <div>{returnStatusObj[params.row.returnStatus]}</div>
        </>
      ),
      // valueGetter: (params: GridValueGetterParams) =>
      //   `${
      //     Status[params.row.productOrderStatus] || params.row.productOrderStatus
      //   } `,
    },
    {
      field: "invoiceNo",
      headerName: "송장번호",
      type: "string",
      width: 350,
      editable: true,
      valueGetter: (params: GridValueGetterParams) =>
        `${params.row.invoiceNo || "송장번호 기입"} `,
      valueSetter: (params: GridValueSetterParams) => {
        const invoiceNo = params.value;
        console.log(invoiceNo);
        params.row["invoiceNo"] = invoiceNo;
        return { ...params.row };
      },
    },
    {
      field: "payAmt",
      headerName: "구매가격",
      type: "string",
      width: 200,
      editable: true,
      valueGetter: (params: GridValueGetterParams) => {
        const payAmt = Number((params.row.payAmt * 1400).toFixed(0));
        return `${params.row.payAmt || 0}USD (${payAmt || 0}) `;
      },
      valueSetter: (params: GridValueSetterParams) => {
        const payAmt = params.value;

        params.row["payAmt"] = payAmt;
        return { ...params.row };
      },
    },
    {
      field: "deliveryAmt",
      headerName: "배대지 가격",
      type: "string",
      width: 200,
      editable: true,
      valueGetter: (params: GridValueGetterParams) =>
        `${params.row.deliveryAmt || 0} `,
      valueSetter: (params: GridValueSetterParams) => {
        const deliveryAmt = params.value;
        params.row["deliveryAmt"] = deliveryAmt;
        return { ...params.row };
      },
    },
    {
      field: "settlementExpectAmount",
      headerName: "마진",
      type: "string",
      width: 200,
      editable: false,
      valueGetter: (params: GridValueGetterParams) => {
        const settlementExpectAmount: number =
          params.row.settlementExpectAmount;
        const payAmt = Number((params.row.payAmt * 1400).toFixed(0));
        const deliveryAmt = params.row.deliveryAmt;
        return `${settlementExpectAmount - payAmt - deliveryAmt}원`;
      },
    },

    {
      field: "발주확인 & 발송처리",
      headerName: "발주확인 & 발송처리",
      description: "This column has a value getter and is not sortable.",
      sortable: false,
      width: 300,
      renderCell: (params) => (
        <>
          <strong>
            <Button
              disabled={
                params.row.orderStatus === "DELIVERING" ||
                params.row.orderStatus === "DEPARTURE"
                  ? true
                  : false
              }
              size="large"
              color={
                params.row.productOrderStatus === "NEW_ORDER" ||
                params.row.productOrderStatus === "ACCEPT"
                  ? "primary"
                  : "warning"
              }
              variant="contained"
              style={{ marginLeft: 16 }}
              onClick={() => {
                params.row.productOrderStatus === "NEW_ORDER" ||
                params.row.productOrderStatus === "ACCEPT"
                  ? confirmOrder(params.row)
                  : updateInvoiceNo(params.row);
              }}
            >
              {params.row.orderStatus === "DELIVERING"
                ? "배송중"
                : params.row.productOrderStatus === "NEW_ORDER" ||
                  params.row.productOrderStatus === "ACCEPT"
                ? "발주확인"
                : "발송처리"}
            </Button>
          </strong>
        </>
      ),
    },
    {
      field: "배대지 신청",
      headerName: "배대지 신청",
      description: "배대지 신청을 해야합니다.",
      sortable: false,
      width: 300,

      renderCell: (params) => (
        <>
          <strong>
            <Button
              disabled={params.row.invoiceNo ? true : false}
              size="large"
              color="primary"
              variant="contained"
              style={{ marginLeft: 16 }}
              onClick={() => {
                ship(params.row);
              }}
            >
              배대지 신청
            </Button>
          </strong>
        </>
      ),
    },
    {
      field: "주문 상태",
      headerName: "주문 상태",
      description: "주문 상태",
      sortable: false,
      width: 300,

      renderCell: (params) => (
        <>
          <strong>
            <Button
              size="large"
              color="primary"
              variant="contained"
              style={{ marginLeft: 16 }}
              onClick={() => {
                updateOrderStatusByProductOrderNo(params.row);
              }}
            >
              주문 상태 업데이트
            </Button>
          </strong>
        </>
      ),
    },
  ];

  const [order, setOrder] = useState<OrderResponse[]>([]);

  async function updateOrderStatusByProductOrderNo(orderInfo: OrderResponse) {
    try {
      const data = await axios.put(
        `${process.env.REACT_APP_API_URL}/smart-store/update/orderStatus`,
        orderInfo
      );
      setOpen({ result: "success", open: true, reason: "" });
    } catch (e: any) {
      setOpen({ result: "error", open: true, reason: "" });
      console.log(e.message);
    }
  }
  function getOrderInfo() {
    axios
      .get(`${process.env.REACT_APP_API_URL}/smart-store/order`)
      .then((response) => {
        setOrder(response.data);
      });
    axios
      .get(`${process.env.REACT_APP_API_URL}/smart-store/newOrder`)
      .then((res) => {
        if (res?.data.reason) {
          setNaverLogin(true);
        }
      });
  }

  async function getNewOrder() {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/openmarket/new_order`
      );
      setOpen({ result: "success", open: true, reason: "신규주문" });
    } catch (e) {
      setOpen({ result: "error", open: true, reason: "신규주문" });
    }
  }

  async function updateOrderInfo(orderInfo: OrderResponse) {
    try {
      const data = await axios.put(
        `${process.env.REACT_APP_API_URL}/smart-store/update/orderInfo`,
        orderInfo
      );
      setOpen({ result: "success", open: true, reason: "" });
    } catch (e: any) {
      setOpen({ result: "error", open: true, reason: "" });
      console.log(e.message);
    }
  }

  async function updateInvoiceNo(orderInfo: OrderResponse) {
    try {
      const data = await axios.post(
        `${process.env.REACT_APP_API_URL}/openmarket/updateInvoiceNo`,
        {
          orderInfo,
        }
      );
      setOpen({ result: "success", open: true, reason: "" });
    } catch (e: any) {
      setOpen({ result: "error", open: true, reason: "" });
      console.log(e.message);
    }
  }

  async function ship(orderInfo: OrderResponse) {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/smart-store/ship/${orderInfo.id}`
      );
      setOpen({ result: "success", open: true, reason: "" });
    } catch (e: any) {
      setOpen({ result: "error", open: true, reason: "" });
      console.log(e.message);
    }
  }
  function handleClick(cellParams: any) {
    if (
      cellParams.field === "invoiceNo" ||
      cellParams.field === "deliveryAmt" ||
      cellParams.field === "orderAmt"
    )
      return;
    navigator.clipboard.writeText(cellParams.value);
  }
  async function confirmOrder(orderInfo: OrderResponse) {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/openmarket/prepare_order`,
        {
          order: orderInfo,
        }
      );
      setOpen({ result: "success", open: true, reason: "발송처리" });
    } catch (e) {
      setOpen({ result: "error", open: true, reason: "발송처리" });
    }
  }

  async function login() {
    try {
      await axios.get(`${process.env.REACT_APP_API_URL}/naver/login/ship`);
      setOpen({ result: "success", open: true, reason: "로그인" });
    } catch (e) {
      setOpen({ result: "error", open: true, reason: "발송처리" });
    }
  }

  useEffect(() => {
    getOrderInfo();
  }, [open]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>스마트스토어 주문 및 배송현황</h1>
        <div className="smartstore_btn">
          <Button
            color="primary"
            size="large"
            variant="contained"
            style={{ margin: 16, fontSize: 30 }}
            onClick={getNewOrder}
          >
            스토어 주문수집
          </Button>
          {naverLogin ? (
            <Button
              color="warning"
              size="large"
              variant="contained"
              onClick={login}
              style={{ margin: 16, fontSize: 30 }}
            >
              Naver Login
            </Button>
          ) : (
            <></>
          )}
        </div>
      </header>
      <div className="App-center">
        <Box sx={{ height: "  80%", width: "100%" }}>
          <DataGridPro
            sx={{ fontSize: "2rem" }}
            onCellEditStop={(data) => {
              updateOrderInfo(data.row);
            }}
            rowHeight={350}
            rows={order}
            columns={columns}
            pagination
            {...order}
          />
        </Box>
        <MuiSnackBar open={open} setOpen={setOpen} />
      </div>
    </div>
  );
}

export default App;
