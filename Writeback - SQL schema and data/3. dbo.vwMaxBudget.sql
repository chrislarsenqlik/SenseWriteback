USE [WritebackTest]
GO

/****** Object:  View [dbo].[vw_MaxBudget]    Script Date: 9/2/2014 12:19:39 PM ******/
DROP VIEW [dbo].[vw_MaxBudget]
GO

/****** Object:  View [dbo].[vw_MaxBudget]    Script Date: 9/2/2014 12:19:39 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



CREATE VIEW [dbo].[vw_MaxBudget] AS
SELECT
    b.BudgetID,
	b.CreationDate,
	b.PeriodNo,
	p.PeriodName,
	b.BudgetAmount,
	isnull(b2.ActualAmount,0) as ActualAmount,
	b.ForecastAmount
FROM
     BudgetTable b
	 left join DimPeriod p on p.PeriodNo=b.PeriodNo
	 left join budgettable b2 on b2.periodno=b.PeriodNo and b2.ActualAmount >0
	where b.budgetid in
	(select max(BudgetID) from BudgetTable group by PeriodNo)

GO


